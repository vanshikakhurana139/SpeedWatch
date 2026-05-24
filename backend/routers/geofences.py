"""
Geofence CRUD endpoints.
GET    /api/geofences/    — list all active zones
POST   /api/geofences/    — create a new zone (supervisor)
PUT    /api/geofences/{id} — update a zone
DELETE /api/geofences/{id} — soft delete a zone
"""
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List
from deps import get_db, get_current_user, require_supervisor, get_redis
import json
import uuid

router = APIRouter(prefix="/geofences", tags=["Geofences"])


class GeofenceCreate(BaseModel):
    name: str
    zone_type: str = "main_road"
    speed_limit: int
    # GeoJSON polygon coordinates: [[[lng, lat], ...]]
    coordinates: List[List[List[float]]]
    time_rules: dict = {}

class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    speed_limit: Optional[int] = None
    time_rules: Optional[dict] = None
    active: Optional[bool] = None


def coords_to_wkt(coordinates: List[List[List[float]]]) -> str:
    """Convert GeoJSON polygon coordinates to WKT POLYGON string."""
    ring = coordinates[0]
    points = ", ".join(f"{p[0]} {p[1]}" for p in ring)
    return f"POLYGON(({points}))"


@router.get("/")
async def list_geofences(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns all active geofences. Used by both app and dashboard."""
    result = await db.execute(
        text("""
            SELECT id, name, zone_type, speed_limit,
                   ST_AsGeoJSON(polygon) as polygon_geojson,
                   time_rules, active, created_at
            FROM geofences
            WHERE active = true
            ORDER BY name
        """)
    )
    rows = result.fetchall()
    geofences = []
    for row in rows:
        gf = dict(row._mapping)
        gf["polygon"] = json.loads(gf.pop("polygon_geojson"))
        geofences.append(gf)
    return geofences


@router.post("/")
async def create_geofence(
    request: GeofenceCreate,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Creates a new geofence zone. Supervisor only."""
    wkt_polygon = coords_to_wkt(request.coordinates)

    gf_id = await db.execute(
        text("""
            INSERT INTO geofences (name, zone_type, speed_limit, polygon, time_rules, created_by)
            VALUES (:name, :ztype, :limit,
                    ST_GeomFromText(:polygon, 4326),
                    :rules, :created_by)
            RETURNING id
        """),
        {
            "name": request.name,
            "ztype": request.zone_type,
            "limit": request.speed_limit,
            "polygon": wkt_polygon,
            "rules": json.dumps(request.time_rules),
            "created_by": current_user.id
        }
    )
    gf_id = str(gf_id.scalar())

    # Invalidate geofence cache in Redis
    await redis.delete("geofences_cache")

    return {"id": gf_id, "status": "created"}


@router.put("/{geofence_id}")
async def update_geofence(
    geofence_id: str,
    request: GeofenceUpdate,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Updates a geofence's properties."""
    updates = []
    params = {"id": uuid.UUID(geofence_id)}

    if request.name is not None:
        updates.append("name = :name")
        params["name"] = request.name
    if request.speed_limit is not None:
        updates.append("speed_limit = :speed_limit")
        params["speed_limit"] = request.speed_limit
    if request.time_rules is not None:
        updates.append("time_rules = :time_rules")
        params["time_rules"] = json.dumps(request.time_rules)
    if request.active is not None:
        updates.append("active = :active")
        params["active"] = request.active

    if not updates:
        return {"status": "no_changes"}

    await db.execute(
        text(f"UPDATE geofences SET {', '.join(updates)} WHERE id = :id"),
        params
    )
    await redis.delete("geofences_cache")
    return {"status": "updated"}


@router.delete("/{geofence_id}")
async def delete_geofence(
    geofence_id: str,
    current_user=Depends(require_supervisor),
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis)
):
    """Soft-deletes a geofence (sets active=false)."""
    await db.execute(
        text("UPDATE geofences SET active = false WHERE id = :id"),
        {"id": uuid.UUID(geofence_id)}
    )
    await redis.delete("geofences_cache")
    return {"status": "deleted"}