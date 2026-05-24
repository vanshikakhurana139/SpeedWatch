"""
SpeedWatch FastAPI Application — Entry Point
All routers are registered here.
CORS is configured to allow the React dashboard and Flutter app.
"""
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from routers import auth, vehicles, trips, violations, geofences, websocket, sos, reports
from deps import engine
import models  # Ensures models are registered

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/speedwatch.log")
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("SpeedWatch API starting up...")
    yield
    logger.info("SpeedWatch API shutting down...")
    await engine.dispose()


app = FastAPI(
    title="SpeedWatch API",
    description="Industrial Vehicle Speed Enforcement System — SAIL RDCIS",
    version="1.0.0",
    lifespan=lifespan
)

# CORS — allows React dashboard (port 3000/5173) and Flutter app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(violations.router, prefix="/api")
app.include_router(geofences.router, prefix="/api")
app.include_router(sos.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

# WebSocket routes (no /api prefix — they use /ws/)
app.include_router(websocket.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SpeedWatch API"}