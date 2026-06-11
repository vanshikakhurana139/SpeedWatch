"""
Reports endpoints.
GET  /api/reports/daily        — Get daily violation data as JSON
POST /api/reports/daily/pdf    — Generate and return PDF
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from datetime import date, timedelta
from typing import Optional
from deps import get_db, require_supervisor
import io

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/daily")
async def get_daily_report(
    report_date: Optional[str] = None,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Returns daily violations summary as JSON."""
    if report_date is None:
        report_date = str(date.today())
    
    try:
        target_date = date.fromisoformat(report_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    next_date = target_date + timedelta(days=1)
    
    result = await db.execute(
        text("""
            SELECT 
                v.id, v.timestamp, v.speed_recorded, v.zone_limit,
                v.penalty_amount, v.violation_number, v.violation_type,
                u.name as driver_name, vh.license_plate,
                ST_Y(v.location) as lat, ST_X(v.location) as lng
            FROM violations v
            JOIN users u ON v.driver_id = u.id
            JOIN vehicles vh ON v.vehicle_id = vh.id
            WHERE v.timestamp >= :start AND v.timestamp < :end
            ORDER BY v.timestamp DESC
        """),
        {"start": target_date, "end": next_date}
    )
    rows = result.fetchall()
    violations = [dict(row._mapping) for row in rows]
    
    # Convert datetime objects to strings for JSON serialization
    for v in violations:
        if hasattr(v.get('timestamp'), 'isoformat'):
            v['timestamp'] = v['timestamp'].isoformat()
    
    total_penalty = sum(v['penalty_amount'] for v in violations)
    
    return {
        "date": report_date,
        "total_violations": len(violations),
        "total_penalty": total_penalty,
        "violations": violations,
    }


@router.get("/weekly-trend")
async def get_weekly_trend(
    end_date: Optional[str] = None,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Returns violation counts and penalty totals for each of the 7 days
    ending on `end_date` (inclusive).  Used by the 7-day bar chart."""
    if end_date is None:
        end_date = str(date.today())

    try:
        target_end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    start_date = target_end - timedelta(days=6)
    day_after_end = target_end + timedelta(days=1)

    result = await db.execute(
        text("""
            SELECT
                DATE(v.timestamp) AS day,
                COUNT(*)          AS violation_count,
                COALESCE(SUM(v.penalty_amount), 0) AS penalty_total
            FROM violations v
            WHERE v.timestamp >= :start AND v.timestamp < :end
            GROUP BY DATE(v.timestamp)
            ORDER BY day
        """),
        {"start": start_date, "end": day_after_end}
    )
    rows = result.fetchall()
    day_map = {str(row._mapping["day"]): row._mapping for row in rows}

    trend = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        key = str(d)
        trend.append({
            "date": key,
            "violations": int(day_map[key]["violation_count"]) if key in day_map else 0,
            "penalties": int(day_map[key]["penalty_total"]) if key in day_map else 0,
        })

    return {"start_date": str(start_date), "end_date": end_date, "trend": trend}


@router.post("/daily/pdf")
async def generate_daily_pdf(
    request_body: dict,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Generates a PDF report for the given date using ReportLab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
        from reportlab.lib.units import cm
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="ReportLab not installed. Run: pip install reportlab"
        )
    
    report_date = request_body.get('date', str(date.today()))
    
    # Get data (reuse the logic above)
    try:
        target_date = date.fromisoformat(report_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    next_date = target_date + timedelta(days=1)
    
    result = await db.execute(
        text("""
            SELECT 
                v.timestamp, v.speed_recorded, v.zone_limit,
                v.penalty_amount, v.violation_number,
                u.name as driver_name, vh.license_plate
            FROM violations v
            JOIN users u ON v.driver_id = u.id
            JOIN vehicles vh ON v.vehicle_id = vh.id
            WHERE v.timestamp >= :start AND v.timestamp < :end
            ORDER BY v.timestamp DESC
        """),
        {"start": target_date, "end": next_date}
    )
    rows = result.fetchall()
    violations = [dict(row._mapping) for row in rows]
    
    # Build PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph(f"SpeedWatch Daily Report — {report_date}", styles['Heading1']))
    story.append(Paragraph(f"SAIL RDCIS | Total Violations: {len(violations)} | Total Penalty: Rs. {sum(v['penalty_amount'] for v in violations)}", styles['Normal']))
    story.append(Spacer(1, 0.5*cm))
    
    # Table
    data = [['DRIVER', 'VEHICLE', 'TIME', 'SPEED', 'LIMIT', 'PENALTY']]
    for v in violations:
        ts = v['timestamp']
        time_str = ts.strftime('%H:%M:%S') if hasattr(ts, 'strftime') else str(ts)[:19]
        data.append([
            str(v['driver_name']),
            str(v['license_plate']),
            time_str,
            f"{v['speed_recorded']:.1f} km/h",
            f"{v['zone_limit']} km/h",
            f"Rs. {v['penalty_amount']}",
        ])
    
    if len(data) > 1:
        table = Table(data, colWidths=[4*cm, 3*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2C2C2E')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F5F5')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("No violations on this date.", styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="report_{report_date}.pdf"'}
    )