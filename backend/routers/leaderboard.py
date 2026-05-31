"""
Leaderboard endpoints.
GET /api/leaderboard/weekly  — Get current week's driver rankings
GET /api/leaderboard/history — Get past weeks
POST /api/leaderboard/calculate — Manually trigger calculation (admin only)
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from deps import get_db, get_current_user, require_supervisor
from datetime import date, timedelta
import json

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("/weekly")
async def get_weekly_leaderboard(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns this week's safety leaderboard.
    
    WHY: Supervisors need to see who the safest drivers are.
    This motivates good behaviour through recognition.
    """
    # Get the most recent week's data
    result = await db.execute(
        text("""
            SELECT 
                wl.rank, wl.driver_name, wl.violation_count,
                wl.harsh_driving_count, wl.total_penalty,
                wl.badge_type, wl.week_start, wl.week_end,
                u.phone
            FROM weekly_leaderboard wl
            JOIN users u ON wl.driver_id = u.id
            WHERE wl.week_start = (
                SELECT MAX(week_start) FROM weekly_leaderboard
            )
            ORDER BY wl.rank ASC
            LIMIT 20
        """)
    )
    rows = result.fetchall()
    
    if not rows:
        # No leaderboard yet — compute it live from violations
        return await _compute_live_leaderboard(db)
    
    return [dict(row._mapping) for row in rows]


@router.get("/all-time")
async def get_all_time_stats(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """Returns all-time driver safety statistics."""
    result = await db.execute(
        text("""
            SELECT 
                u.name as driver_name,
                u.phone,
                COUNT(v.id) as total_violations,
                COALESCE(SUM(v.penalty_amount), 0) as total_penalty,
                MAX(v.speed_recorded) as max_speed_ever,
                COUNT(DISTINCT t.id) as total_trips
            FROM users u
            LEFT JOIN violations v ON v.driver_id = u.id
            LEFT JOIN trips t ON t.driver_id = u.id
            WHERE u.role = 'driver'
            GROUP BY u.id, u.name, u.phone
            ORDER BY total_violations ASC
        """)
    )
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]


@router.post("/calculate")
async def calculate_leaderboard(
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually triggers leaderboard calculation.
    Normally runs automatically every Sunday at 23:00.
    """
    result = await _compute_and_save_leaderboard(db)
    return {"status": "calculated", "entries": len(result)}


async def _compute_live_leaderboard(db: AsyncSession):
    """
    Computes leaderboard from raw violations data.
    Used when no pre-calculated data exists yet.
    """
    week_ago = date.today() - timedelta(days=7)
    
    result = await db.execute(
        text("""
            SELECT 
                u.id as driver_id,
                u.name as driver_name,
                u.phone,
                COUNT(v.id) as violation_count,
                COALESCE(SUM(v.penalty_amount), 0) as total_penalty,
                COUNT(CASE WHEN v.violation_type = 'harsh_driving' THEN 1 END) as harsh_driving_count
            FROM users u
            LEFT JOIN violations v ON v.driver_id = u.id 
                AND v.timestamp >= :week_ago
            WHERE u.role = 'driver' AND u.is_active = true
            GROUP BY u.id, u.name, u.phone
            ORDER BY violation_count ASC, total_penalty ASC
        """),
        {"week_ago": week_ago}
    )
    rows = result.fetchall()
    
    leaderboard = []
    badges = ['GOLD', 'SILVER', 'BRONZE']
    
    for i, row in enumerate(rows):
        entry = dict(row._mapping)
        entry['rank'] = i + 1
        entry['badge_type'] = badges[i] if i < 3 else None
        entry['week_start'] = week_ago.isoformat()
        entry['week_end'] = date.today().isoformat()
        leaderboard.append(entry)
    
    return leaderboard


async def _compute_and_save_leaderboard(db: AsyncSession):
    """Computes leaderboard and saves to DB for history."""
    today = date.today()
    # Find the most recent Sunday
    days_since_sunday = today.weekday() + 1
    week_end = today
    week_start = today - timedelta(days=7)
    
    result = await db.execute(
        text("""
            SELECT 
                u.id as driver_id,
                u.vendor_id,
                u.name as driver_name,
                COUNT(v.id) as violation_count,
                COALESCE(SUM(v.penalty_amount), 0) as total_penalty,
                COUNT(CASE WHEN v.violation_type = 'harsh_driving' THEN 1 END) as harsh_count
            FROM users u
            LEFT JOIN violations v ON v.driver_id = u.id 
                AND v.timestamp >= :start AND v.timestamp < :end
            WHERE u.role = 'driver' AND u.is_active = true
            GROUP BY u.id, u.vendor_id, u.name
            ORDER BY violation_count ASC, total_penalty ASC
        """),
        {"start": week_start, "end": week_end}
    )
    rows = result.fetchall()
    
    badges = ['GOLD', 'SILVER', 'BRONZE']
    entries = []
    
    for i, row in enumerate(rows):
        badge = badges[i] if i < 3 else None
        await db.execute(
            text("""
                INSERT INTO weekly_leaderboard 
                (week_start, week_end, driver_id, vendor_id, driver_name,
                 violation_count, harsh_driving_count, total_penalty, rank, badge_type)
                VALUES (:ws, :we, :did, :vid, :name, :vc, :hc, :tp, :rank, :badge)
                ON CONFLICT (week_start, driver_id) DO UPDATE
                SET violation_count = EXCLUDED.violation_count,
                    total_penalty = EXCLUDED.total_penalty,
                    rank = EXCLUDED.rank,
                    badge_type = EXCLUDED.badge_type
            """),
            {
                "ws": week_start, "we": week_end,
                "did": row.driver_id, "vid": row.vendor_id,
                "name": row.driver_name, "vc": row.violation_count,
                "hc": row.harsh_count, "tp": row.total_penalty,
                "rank": i + 1, "badge": badge
            }
        )
        entries.append(row)
    
    return entries