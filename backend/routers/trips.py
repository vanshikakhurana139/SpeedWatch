"""
Trip management endpoints.
POST /api/trips/start        — start a new trip
POST /api/trips/{id}/end     — end a trip
POST /api/trips/{id}/position — append GPS point
GET  /api/trips/{id}/path    — get full GPS path for replay
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from deps import get_db, get_current_user, get_redis
import json
import uuid

router = APIRouter(prefix="/trips", tags=["Trips"])


class StartTripRequest(BaseModel):
    vehicle_id: str
    load_type: str = "empty"  # empty, partial, full, hazardous

class PositionUpdate(BaseModel):
    lat: float
    lng: float
    speed: float       # km/h
    accuracy: float = 0.0
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
            "vehicle_id": request.vehicle_id,
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
        {"tid": trip_id, "did": current_user.id}
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
    - Broadcasts via WebSocket to all supervisors (handled in websocket.py)
    - Updates max_speed on the trip record if needed
    """
    # Get vehicle_id for this trip
    result = await db.execute(
        text("SELECT vehicle_id FROM trips WHERE id = :tid AND driver_id = :did AND status = 'active'"),
        {"tid": trip_id, "did": current_user.id}
    )
    trip = result.fetchone()
    if not trip:
        raise HTTPException(status_code=404, detail="Active trip not found")

    vehicle_id = str(trip.vehicle_id)

    # Update max_speed
    await db.execute(
        text("""
            UPDATE trips SET max_speed = GREATEST(max_speed, :speed)
            WHERE id = :tid
        """),
        {"speed": pos.speed, "tid": trip_id}
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
        {"tid": trip_id}
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