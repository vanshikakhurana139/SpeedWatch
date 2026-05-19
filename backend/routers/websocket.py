"""
WebSocket Server — Real-time backbone of SpeedWatch.
/ws/supervisor?token={jwt} — supervisors connect here
/ws/driver?token={jwt}&trip_id={id} — drivers connect during trips
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from config import settings
from deps import get_redis
import asyncio
import json
import logging

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages all active WebSocket connections.
    Supervisors are stored in a dict so we can broadcast to all of them.
    """
    def __init__(self):
        self.supervisor_connections: dict[str, WebSocket] = {}
        self.driver_connections: dict[str, WebSocket] = {}

    async def connect_supervisor(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.supervisor_connections[user_id] = websocket
        logger.info(f"Supervisor {user_id} connected. Total: {len(self.supervisor_connections)}")

    async def connect_driver(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.driver_connections[user_id] = websocket

    def disconnect_supervisor(self, user_id: str):
        self.supervisor_connections.pop(user_id, None)

    def disconnect_driver(self, user_id: str):
        self.driver_connections.pop(user_id, None)

    async def broadcast_to_supervisors(self, message: dict):
        """Sends a message to ALL connected supervisors."""
        disconnected = []
        for user_id, ws in self.supervisor_connections.items():
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(user_id)
        for uid in disconnected:
            self.disconnect_supervisor(uid)

    async def send_to_driver(self, user_id: str, message: dict):
        """Sends a message to a specific driver."""
        ws = self.driver_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
                return True
            except Exception:
                self.disconnect_driver(user_id)
        return False


manager = ConnectionManager()


def verify_token(token: str) -> dict:
    """Validates JWT and returns payload."""
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None


@router.websocket("/ws/supervisor")
async def supervisor_websocket(websocket: WebSocket, token: str = Query(...)):
    """
    Supervisors connect here on dashboard load.
    They receive live position updates, violations, SOS, and incident events.
    """
    payload = verify_token(token)
    if not payload or payload.get("role") not in ("supervisor", "admin"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]
    await manager.connect_supervisor(user_id, websocket)

    # Subscribe to Redis pub/sub for events from the REST API
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("speedwatch:events")

    try:
        # Start a background task to forward Redis events to this supervisor
        async def forward_redis_events():
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event = json.loads(message["data"])
                        await websocket.send_json(event)
                    except Exception:
                        break

        forward_task = asyncio.create_task(forward_redis_events())

        # Keep connection alive; listen for messages from supervisor
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            # Supervisor sending a voice command to a driver
            if msg.get("type") == "voice_command":
                target_driver_id = msg.get("driver_id")
                await manager.send_to_driver(target_driver_id, {
                    "type": "voice_command",
                    "message": msg.get("message"),
                    "from_supervisor": user_id
                })

    except WebSocketDisconnect:
        forward_task.cancel()
        await pubsub.unsubscribe("speedwatch:events")
        manager.disconnect_supervisor(user_id)
        logger.info(f"Supervisor {user_id} disconnected")


@router.websocket("/ws/driver")
async def driver_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    trip_id: str = Query(...)
):
    """
    Driver app connects here when a trip is active.
    Used to receive voice commands and training unlock notifications.
    """
    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]
    await manager.connect_driver(user_id, websocket)

    try:
        while True:
            # Receive position updates from driver and broadcast to supervisors
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "position":
                await manager.broadcast_to_supervisors({
                    "type": "position",
                    "vehicle_id": msg.get("vehicle_id"),
                    "driver_id": user_id,
                    "lat": msg.get("lat"),
                    "lng": msg.get("lng"),
                    "speed": msg.get("speed"),
                    "status": msg.get("status"),  # safe/warning/violation
                    "trip_id": trip_id
                })

    except WebSocketDisconnect:
        manager.disconnect_driver(user_id)