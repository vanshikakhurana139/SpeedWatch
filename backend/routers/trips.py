"""
Trip management endpoints.
POST /api/trips/start        — start a new trip
POST /api/trips/{id}/end     — end a trip
POST /api/trips/{id}/position — append GPS point
GET  /api/trips/{id}/path    — get full GPS path for replay
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
from .websocket import manager   # <-- ADD THIS

router = APIRouter(prefix="/trips", tags=["Trips"])


class StartTripRequest(BaseModel):
    vehicle_id: str
    load_type: str = "empty"  # empty, partial, full, hazardous

class PositionUpdate(BaseModel):
    lat: float
    lng: float
    speed: float       # km/h
    accuracy: Optional[float] = 0.0
    heading: Optional[float] = None


@router.post("/start")
async def start_trip(
    request: StartTripRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new trip record. Returns trip_id for the mobile app to use."""

    # Check if driver already has an active trip
    result = await db.execute(
        text("SELECT id FROM trips WHERE driver_id = :did AND status = 'active'"),
        {"did": current_user.id}
    )
    if result.fetchone():
        raise HTTPException(status_code=400, detail="Driver already has an active trip")

    trip_id = await db.execute(
        text("""
            INSERT INTO trips (vehicle_id, driver_id, load_type, status)
            VALUES (:vehicle_id, :driver_id, :load_type, 'active')
            RETURNING id
        """),
        {
            "vehicle_id": uuid.UUID(request.vehicle_id),
            "driver_id": current_user.id,
            "load_type": request.load_type
        }
    )
    trip_id = trip_id.scalar()
    return {"trip_id": str(trip_id), "status": "active"}


@router.post("/{trip_id}/end")
async def end_trip(
    trip_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Closes an active trip and computes final stats."""
    result = await db.execute(
        text("""
            UPDATE trips
            SET status = 'completed', end_time = NOW()
            WHERE id = :tid AND driver_id = :did AND status = 'active'
            RETURNING id, violation_count, total_penalty, max_speed
        """),
        {"tid": uuid.UUID(trip_id), "did": current_user.id}
    )
    trip = result.fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Active trip not found")

    # Remove from Redis live position cache
    await redis.delete(f"vehicle_position:{trip_id}")

    return {
        "trip_id": trip_id,
        "status": "completed",
        "violation_count": trip.violation_count,
        "total_penalty": trip.total_penalty,
        "max_speed": trip.max_speed
    }


@router.post("/{trip_id}/position")
async def update_position(
    trip_id: str,
    pos: PositionUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """
    Receives a GPS position update from the driver app.
    - Updates Redis with latest position (for fast map reads)
    - Broadcasts via WebSocket to all supervisors
    - Updates max_speed on the trip record if needed
    """
    # Get vehicle_id and driver name for this trip
    result = await db.execute(
        text("""
            SELECT t.vehicle_id, u.name as driver_name
            FROM trips t
            JOIN users u ON t.driver_id = u.id
            WHERE t.id = :tid AND t.driver_id = :did AND t.status = 'active'
        """),
        {"tid": uuid.UUID(trip_id), "did": current_user.id}
    )
    trip = result.fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Active trip not found")

    vehicle_id = str(trip.vehicle_id)
    driver_name = trip.driver_name

    # Update max_speed
    await db.execute(
        text("""
            UPDATE trips SET max_speed = GREATEST(max_speed, :speed)
            WHERE id = :tid
        """),
        {"speed": pos.speed, "tid": uuid.UUID(trip_id)}
    )

    # Cache latest position in Redis (expires in 30 seconds)
    position_data = json.dumps({
        "lat": pos.lat,
        "lng": pos.lng,
        "speed": round(pos.speed, 1),
        "trip_id": trip_id,
        "driver_id": str(current_user.id),
        "vehicle_id": vehicle_id,
        "timestamp": str(__import__('datetime').datetime.utcnow())
    })
    await redis.setex(f"vehicle_position:{vehicle_id}", 30, position_data)

    # ─────────────────────────────────────────────────────────
    # WebSocket broadcast to all supervisors
    # ─────────────────────────────────────────────────────────
    # Determine status based on speed (default limit 50 km/h)
    # In a production system, you would fetch the current geofence limit
    limit = 50
    if pos.speed > limit:
        status = "violation"
    elif pos.speed > limit * 0.8:
        status = "warning"
    else:
        status = "safe"

    await manager.broadcast_to_supervisors({
        "type": "position",
        "vehicle_id": vehicle_id,
        "driver_id": str(current_user.id),
        "driver_name": driver_name,
        "lat": pos.lat,
        "lng": pos.lng,
        "speed": round(pos.speed, 1),
        "status": status,
        "trip_id": trip_id,
    })

    return {"status": "ok"}


@router.get("/{trip_id}/path")
async def get_trip_path(
    trip_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns full GPS path for trip replay. Supervisors only."""
    if current_user.role == "driver":
        raise HTTPException(status_code=403, detail="Supervisor access required")

    result = await db.execute(
        text("""
            SELECT ST_AsGeoJSON(path) as path_geojson,
                   start_time, end_time, max_speed, total_penalty, violation_count
            FROM trips WHERE id = :tid
        """),
        {"tid": uuid.UUID(trip_id)}
    )
    trip = result.fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    return {
        "trip_id": trip_id,
        "path": json.loads(trip.path_geojson) if trip.path_geojson else None,
        "start_time": trip.start_time,
        "end_time": trip.end_time,
        "max_speed": trip.max_speed,
        "total_penalty": trip.total_penalty,
        "violation_count": trip.violation_count
    }