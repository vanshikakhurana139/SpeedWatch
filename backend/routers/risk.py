"""
Driver Risk Score endpoints.
GET /api/risk/drivers     — All drivers with their current risk scores
GET /api/risk/{driver_id} — Single driver risk details
POST /api/risk/calculate  — Recalculate all risk scores
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from deps import get_db, require_supervisor
from datetime import date, timedelta

router = APIRouter(prefix="/risk", tags=["Risk Scoring"])


def calculate_risk_score(
    violations_7d: int,
    harsh_driving_7d: int,
    max_speed_7d: float,
    violations_30d: int
) -> tuple[int, str]:
    """
    Calculates a 0-100 risk score for a driver.
    
    WHY (The Logic):
    - More recent violations = higher risk (7-day window weighted more)
    - Harsh driving is extra dangerous (weighted 1.5x)
    - Very high speeds are extremely dangerous (exponential weight)
    - Long-term pattern matters too (30-day history)
    
    Score ranges:
    - 0-30: LOW risk (green) — safe driver
    - 31-70: MEDIUM risk (amber) — needs monitoring  
    - 71-100: HIGH risk (red) — intervention needed
    """
    score = 0
    
    # Recent violations (0-40 points)
    # Each violation in last 7 days = 8 points, max 40
    score += min(violations_7d * 8, 40)
    
    # Harsh driving (0-20 points)
    # Each harsh driving event = 10 points, max 20
    score += min(harsh_driving_7d * 10, 20)
    
    # Max speed severity (0-30 points)
    # Over 80 km/h = 30 points (very dangerous in plant)
    # Over 70 km/h = 20 points
    # Over 60 km/h = 10 points
    if max_speed_7d > 80:
        score += 30
    elif max_speed_7d > 70:
        score += 20
    elif max_speed_7d > 60:
        score += 10
    
    # Long-term pattern (0-10 points)
    # 30-day violation history shows whether this is habitual
    score += min(violations_30d * 2, 10)
    
    # Cap at 100
    score = min(score, 100)
    
    # Determine risk level
    if score <= 30:
        level = 'LOW'
    elif score <= 70:
        level = 'MEDIUM'
    else:
        level = 'HIGH'
    
    return score, level


@router.get("/drivers")
async def get_all_risk_scores(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns risk scores for all active drivers.
    If no scores exist yet, calculates them live.
    """
    # Try to get today's pre-calculated scores
    result = await db.execute(
        text("""
            SELECT 
                drs.driver_id, u.name as driver_name,
                drs.risk_score, drs.risk_level,
                drs.violation_7d, drs.harsh_driving_7d,
                drs.max_speed_7d, drs.score_date
            FROM daily_risk_scores drs
            JOIN users u ON drs.driver_id = u.id
            WHERE drs.score_date = CURRENT_DATE
            ORDER BY drs.risk_score DESC
        """)
    )
    rows = result.fetchall()
    
    if rows:
        return [dict(row._mapping) for row in rows]
    
    # Calculate live
    return await _calculate_all_scores(db)


@router.post("/calculate")
async def recalculate_risk_scores(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Forces recalculation of all risk scores."""
    scores = await _calculate_all_scores(db)
    return {"status": "calculated", "drivers_scored": len(scores)}


async def _calculate_all_scores(db: AsyncSession):
    """
    Calculates risk scores for all drivers from raw violation data.
    
    This is called nightly by the cron job OR on-demand from the dashboard.
    """
    seven_days_ago = date.today() - timedelta(days=7)
    thirty_days_ago = date.today() - timedelta(days=30)
    
    # Get all drivers with their violation stats
    result = await db.execute(
        text("""
            SELECT 
                u.id as driver_id,
                u.name as driver_name,
                COUNT(CASE WHEN v.timestamp >= :seven_days AND v.violation_type = 'overspeed' THEN 1 END) as violations_7d,
                COUNT(CASE WHEN v.timestamp >= :seven_days AND v.violation_type = 'harsh_driving' THEN 1 END) as harsh_7d,
                COALESCE(MAX(CASE WHEN v.timestamp >= :seven_days THEN v.speed_recorded END), 0) as max_speed_7d,
                COUNT(CASE WHEN v.timestamp >= :thirty_days THEN 1 END) as violations_30d
            FROM users u
            LEFT JOIN violations v ON v.driver_id = u.id
            WHERE u.role = 'driver' AND u.is_active = true
            GROUP BY u.id, u.name
        """),
        {
            "seven_days": seven_days_ago,
            "thirty_days": thirty_days_ago
        }
    )
    drivers = result.fetchall()
    
    scores = []
    for driver in drivers:
        score, level = calculate_risk_score(
            driver.violations_7d or 0,
            driver.harsh_7d or 0,
            driver.max_speed_7d or 0,
            driver.violations_30d or 0
        )
        
        # Save to DB
        await db.execute(
            text("""
                INSERT INTO daily_risk_scores
                (driver_id, risk_score, risk_level, violation_7d,
                 harsh_driving_7d, max_speed_7d, score_date)
                VALUES (:did, :score, :level, :v7, :h7, :ms, CURRENT_DATE)
                ON CONFLICT (driver_id, score_date) DO UPDATE
                SET risk_score = EXCLUDED.risk_score,
                    risk_level = EXCLUDED.risk_level
            """),
            {
                "did": driver.driver_id,
                "score": score,
                "level": level,
                "v7": driver.violations_7d or 0,
                "h7": driver.harsh_7d or 0,
                "ms": driver.max_speed_7d or 0
            }
        )
        
        scores.append({
            "driver_id": str(driver.driver_id),
            "driver_name": driver.driver_name,
            "risk_score": score,
            "risk_level": level,
            "violation_7d": driver.violations_7d or 0,
            "harsh_driving_7d": driver.harsh_7d or 0,
            "max_speed_7d": driver.max_speed_7d or 0
        })
    
    return scores