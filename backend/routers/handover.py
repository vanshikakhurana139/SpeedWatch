"""
Shift Handover endpoints.
GET  /api/handover/current   — Get latest handover brief
POST /api/handover/generate  — Generate handover for current shift
POST /api/handover/{id}/sign — Supervisor signs off on shift
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from deps import get_db, get_current_user, require_supervisor
from datetime import datetime, timedelta
import json
import uuid

router = APIRouter(prefix="/handover", tags=["Shift Handover"])


def get_current_shift():
    """
    Determines which shift we are currently in.
    
    WHY: SAIL runs 3 shifts:
    - Morning: 06:00 - 14:00
    - Afternoon: 14:00 - 22:00  
    - Night: 22:00 - 06:00
    """
    hour = datetime.now().hour
    if 6 <= hour < 14:
        return 'morning', datetime.now().replace(hour=6, minute=0, second=0)
    elif 14 <= hour < 22:
        return 'afternoon', datetime.now().replace(hour=14, minute=0, second=0)
    else:
        if hour >= 22:
            return 'night', datetime.now().replace(hour=22, minute=0, second=0)
        else:
            return 'night', (datetime.now() - timedelta(days=1)).replace(hour=22, minute=0, second=0)


@router.get("/current")
async def get_current_handover(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the most recent shift handover brief.
    Shown as a modal to supervisors when they log in.
    """
    result = await db.execute(
        text("""
            SELECT id, shift_start, shift_end, shift_type,
                   total_violations, total_penalty, active_vehicles,
                   near_lockout_drivers, top_violators, high_risk_zones,
                   signed_off_at, created_at
            FROM shift_handovers
            ORDER BY created_at DESC
            LIMIT 1
        """)
    )
    row = result.fetchone()
    
    if not row:
        # Generate one live
        return await _generate_live_handover(db)
    
    data = dict(row._mapping)
    # Parse JSON fields
    data['near_lockout_drivers'] = data['near_lockout_drivers'] or []
    data['top_violators'] = data['top_violators'] or []
    data['high_risk_zones'] = data['high_risk_zones'] or []
    return data


@router.post("/generate")
async def generate_handover(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Manually generates a shift handover report."""
    return await _generate_live_handover(db)


@router.post("/{handover_id}/sign")
async def sign_handover(
    handover_id: str,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Outgoing supervisor signs off on their shift."""
    await db.execute(
        text("""
            UPDATE shift_handovers 
            SET signed_off_by = :uid, signed_off_at = NOW()
            WHERE id = :id
        """),
        {"uid": current_user.id, "id": uuid.UUID(handover_id)}
    )
    return {"status": "signed"}


async def _generate_live_handover(db: AsyncSession):
    """Generates handover data from current shift's activity."""
    shift_type, shift_start = get_current_shift()
    shift_end = datetime.now()
    
    # Total violations this shift
    viol_result = await db.execute(
        text("""
            SELECT COUNT(*) as count, COALESCE(SUM(penalty_amount), 0) as total
            FROM violations WHERE timestamp >= :start
        """),
        {"start": shift_start}
    )
    viol_row = viol_result.fetchone()
    
    # Drivers near lockout (4+ violations today)
    lockout_result = await db.execute(
        text("""
            SELECT u.name, u.phone, COUNT(v.id) as count
            FROM violations v
            JOIN users u ON v.driver_id = u.id
            WHERE v.timestamp >= CURRENT_DATE
            GROUP BY u.id, u.name, u.phone
            HAVING COUNT(v.id) >= 4
            ORDER BY count DESC
        """)
    )
    near_lockout = [dict(r._mapping) for r in lockout_result.fetchall()]
    
    # Top violators this shift
    top_result = await db.execute(
        text("""
            SELECT u.name, COUNT(v.id) as violations,
                   COALESCE(SUM(v.penalty_amount), 0) as penalty
            FROM violations v
            JOIN users u ON v.driver_id = u.id
            WHERE v.timestamp >= :start
            GROUP BY u.id, u.name
            ORDER BY violations DESC
            LIMIT 5
        """),
        {"start": shift_start}
    )
    top_violators = [dict(r._mapping) for r in top_result.fetchall()]
    
    # Active vehicles count
    active_result = await db.execute(
        text("SELECT COUNT(*) FROM trips WHERE status = 'active'")
    )
    active_count = active_result.scalar() or 0
    
    return {
        "shift_type": shift_type,
        "shift_start": shift_start.isoformat(),
        "shift_end": shift_end.isoformat(),
        "total_violations": viol_row.count if viol_row else 0,
        "total_penalty": viol_row.total if viol_row else 0,
        "active_vehicles": active_count,
        "near_lockout_drivers": near_lockout,
        "top_violators": top_violators,
        "high_risk_zones": []  # Would need geofence analysis
    }