"""
Geofence Checker Service
Given a GPS coordinate, returns the applicable speed limit.
This is called on EVERY position update — must be fast.
"""
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import] 
from sqlalchemy import text
from datetime import datetime
import json


async def get_speed_limit_for_position(
    lat: float,
    lng: float,
    db: AsyncSession,
    load_type: str = "empty"
) -> dict:
    """
    Returns the applicable speed limit for a given GPS position.
    
    Logic:
    1. Query PostGIS for any active geofence polygon containing this point
    2. Apply time-based rules if present  
    3. Apply load-type adjustments
    4. Return the MINIMUM speed limit (most restrictive applies)
    
    The ST_Within query uses the spatial GIST index and is very fast.
    """
    
    result = await db.execute(
        text("""
            SELECT id, name, speed_limit, zone_type, time_rules
            FROM geofences
            WHERE active = true
            AND ST_Within(
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                polygon
            )
            ORDER BY speed_limit ASC
            LIMIT 1
        """),
        {"lat": lat, "lng": lng}
    )
    zone = result.fetchone()
    
    # Default plant-wide limit
    default_limit = 50
    
    # Load-type overrides (from blueprint section on load-aware limits)
    load_limits = {
        "empty": 50,
        "partial": 50,
        "full": 40,
        "hazardous": 30
    }
    load_limit = load_limits.get(load_type, 50)
    
    if zone:
        zone_limit = zone.speed_limit
        
        # Check time-based rules
        time_rules = zone.time_rules if isinstance(zone.time_rules, dict) else json.loads(zone.time_rules or "{}")
        if time_rules:
            current_hour = datetime.now().hour
            for period, rules in time_rules.items():
                if "start" in rules and "end" in rules:
                    start_h = int(rules["start"].split(":")[0])
                    end_h = int(rules["end"].split(":")[0])
                    in_period = (
                        (start_h <= current_hour < end_h) if start_h < end_h
                        else (current_hour >= start_h or current_hour < end_h)
                    )
                    if in_period and "limit" in rules:
                        zone_limit = min(zone_limit, rules["limit"])
        
        # Apply load-type adjustment within zone
        if load_type == "hazardous":
            zone_limit = min(zone_limit, 10)  # Max 10 km/h for hazardous in any zone
        
        # Take the most restrictive limit
        effective_limit = min(zone_limit, load_limit)
        
        return {
            "speed_limit": effective_limit,
            "zone_name": zone.name,
            "zone_id": str(zone.id),
            "zone_type": zone.zone_type,
            "inside_zone": True
        }
    
    # No zone found — apply plant default and load limit
    return {
        "speed_limit": min(default_limit, load_limit),
        "zone_name": "Plant Road",
        "zone_id": None,
        "zone_type": "main_road",
        "inside_zone": False
    }