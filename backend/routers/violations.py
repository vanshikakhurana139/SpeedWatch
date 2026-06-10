"""
Violation logging — the core business logic endpoint.
POST /api/violations/ — log a speed violation with progressive penalty
GET  /api/violations/ — query violations with filters
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
from deps import get_db, get_current_user, get_redis
import json
import uuid

router = APIRouter(prefix="/violations", tags=["Violations"])


class ViolationRequest(BaseModel):
    trip_id: str
    vehicle_id: str
    speed_recorded: float
    zone_limit: int
    lat: float
    lng: float
    geofence_id: Optional[str] = None
    violation_type: str = "overspeed"
    synced_from_offline: bool = False


@router.post("/")
async def log_violation(
    request: ViolationRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """
    Logs a speed violation and calculates the progressive penalty.
    
    PROGRESSIVE PENALTY LOGIC:
    - Count how many violations the driver has had TODAY
    - penalty = Rs. 100 per violation
    """

    # Count today's violations for this driver
    count_result = await db.execute(
        text("""
            SELECT COUNT(*) as count FROM violations
            WHERE driver_id = :did
            AND timestamp >= CURRENT_DATE
            AND timestamp < CURRENT_DATE + INTERVAL '1 day'
        """),
        {"did": current_user.id}
    )
    today_count = count_result.scalar() or 0
    violation_number = today_count + 1
    penalty_amount = 100

    # Insert the violation record
    violation_id = await db.execute(
        text("""
            INSERT INTO violations (
                trip_id, vehicle_id, driver_id,
                speed_recorded, zone_limit, penalty_amount,
                violation_number, violation_type,
                location, geofence_id, synced_from_offline
            ) VALUES (
                :trip_id, :vehicle_id, :driver_id,
                :speed, :zone_limit, :penalty,
                :vnum, :vtype,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                :gf_id, :offline
            )
            RETURNING id
        """),
        {
            "trip_id": uuid.UUID(request.trip_id),
            "vehicle_id": uuid.UUID(request.vehicle_id),
            "driver_id": current_user.id,
            "speed": request.speed_recorded,
            "zone_limit": request.zone_limit,
            "penalty": penalty_amount,
            "vnum": violation_number,
            "vtype": request.violation_type,
            "lat": request.lat,
            "lng": request.lng,
            "gf_id": uuid.UUID(request.geofence_id) if request.geofence_id else None,
            "offline": request.synced_from_offline
        }
    )
    violation_id = str(violation_id.scalar())

    # Update trip totals
    await db.execute(
        text("""
            UPDATE trips
            SET total_penalty = total_penalty + :penalty,
                violation_count = violation_count + 1
            WHERE id = :tid
        """),
        {"penalty": penalty_amount, "tid": uuid.UUID(request.trip_id)}
    )

    # Update or insert daily penalty summary
    await db.execute(
        text("""
            INSERT INTO daily_penalties (driver_id, vendor_id, date, total_amount, violation_count)
            SELECT :did, u.vendor_id, CURRENT_DATE, :amount, 1
            FROM users u WHERE u.id = :did
            ON CONFLICT (driver_id, date)
            DO UPDATE SET
                total_amount = daily_penalties.total_amount + :amount,
                violation_count = daily_penalties.violation_count + 1
        """),
        {"did": current_user.id, "amount": penalty_amount}
    )

    # Publish violation event to Redis pub/sub for WebSocket broadcast
    violation_event = json.dumps({
        "type": "violation",
        "violation_id": violation_id,
        "vehicle_id": request.vehicle_id,
        "driver_id": str(current_user.id),
        "driver_name": current_user.name,
        "speed_recorded": request.speed_recorded,
        "zone_limit": request.zone_limit,
        "penalty_amount": penalty_amount,
        "violation_number": violation_number,
        "lat": request.lat,
        "lng": request.lng
    })
    await redis.publish("speedwatch:events", violation_event)
# ─────────────────────────────────────────────────────────────────
    # PHASE 4: Predictive Second-Hit Alert
    # If this driver has 3+ violations in last 10 minutes, warn supervisors
    # ─────────────────────────────────────────────────────────────────
    ten_mins_ago = __import__('datetime').datetime.utcnow() - __import__('datetime').timedelta(minutes=10)
    recent_count_result = await db.execute(
        text("""
            SELECT COUNT(*) as cnt FROM violations
            WHERE driver_id = :did AND timestamp >= :ten_ago
        """),
        {"did": current_user.id, "ten_ago": ten_mins_ago}
    )
    recent_count = recent_count_result.scalar() or 0
    
    if recent_count >= 3:
        # Broadcast second-hit warning to all supervisors
        second_hit_event = json.dumps({
            "type": "second_hit_warning",
            "vehicle_id": request.vehicle_id,
            "driver_id": str(current_user.id),
            "driver_name": current_user.name,
            "violation_count_10min": recent_count,
            "message": f"WARNING: {recent_count} violations in last 10 minutes!"
        })
        await redis.publish("speedwatch:events", second_hit_event)
    return {
        "violation_id": violation_id,
        "violation_number": violation_number,
        "penalty_amount": penalty_amount,
        "today_total_violations": violation_number,
        "today_total_penalty": 100 * violation_number,
        "lockout_warning": violation_number >= 4,
        "training_required": violation_number >= 5
    }


@router.get("/")
async def list_violations(
    trip_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    limit: int = 50,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists violations. Drivers can only see their own."""
    where_clauses = []
    params = {"limit": limit}

    if current_user.role == "driver":
        where_clauses.append("v.driver_id = :my_id")
        params["my_id"] = current_user.id
    elif driver_id:
        where_clauses.append("v.driver_id = :driver_id")
        params["driver_id"] = uuid.UUID(driver_id)

    if trip_id:
        where_clauses.append("v.trip_id = :trip_id")
        params["trip_id"] = uuid.UUID(trip_id)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    result = await db.execute(
        text(f"""
            SELECT v.id, v.timestamp, v.speed_recorded, v.zone_limit,
                   v.penalty_amount, v.violation_number, v.violation_type,
                   ST_Y(v.location) as lat, ST_X(v.location) as lng,
                   u.name as driver_name, vh.license_plate
            FROM violations v
            JOIN users u ON v.driver_id = u.id
            JOIN vehicles vh ON v.vehicle_id = vh.id
            {where_sql}
            ORDER BY v.timestamp DESC
            LIMIT :limit
        """),
        params
    )
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]