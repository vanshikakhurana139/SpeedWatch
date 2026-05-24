"""SOS emergency alert endpoint."""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from deps import get_db, get_current_user, get_redis
import json
import uuid

router = APIRouter(prefix="/sos", tags=["SOS"])

class SOSRequest(BaseModel):
    vehicle_id: str
    trip_id: str
    lat: float
    lng: float

@router.post("/")
async def send_sos(
    request: SOSRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Logs an SOS event and broadcasts to all supervisors immediately."""
    await db.execute(
        text("""
            INSERT INTO sos_events (driver_id, vehicle_id, trip_id, location)
            VALUES (:did, :vid, :tid, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
        """),
        {
            "did": current_user.id,
            "vid": uuid.UUID(request.vehicle_id),
            "tid": uuid.UUID(request.trip_id),
            "lat": request.lat,
            "lng": request.lng
        }
    )

    # Publish SOS event — WebSocket server picks this up and broadcasts
    await redis.publish("speedwatch:events", json.dumps({
        "type": "sos",
        "driver_id": str(current_user.id),
        "driver_name": current_user.name,
        "vehicle_id": request.vehicle_id,
        "lat": request.lat,
        "lng": request.lng
    }))
    
    return {"status": "sos_sent", "message": "Emergency alert sent to all supervisors"}