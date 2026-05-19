"""
SpeedWatch Seed Data Script
Run this ONCE after the database is created to populate test data.
Usage: python scripts/seed.py
"""

import asyncio
# pyrefly: ignore [missing-import]
import asyncpg
import hashlib
import json
import os
from datetime import datetime

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://speedwatch_user:speedwatch_pass@localhost:5432/speedwatch_db"
)

def hash_password(password: str) -> str:
    """Simple SHA256 hash for seed data (production uses bcrypt via FastAPI)"""
    return hashlib.sha256(password.encode()).hexdigest()

async def seed():
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        print("Clearing existing seed data...")
        # Order matters due to foreign keys
        await conn.execute("DELETE FROM violations")
        await conn.execute("DELETE FROM trips")
        await conn.execute("DELETE FROM incidents")
        await conn.execute("DELETE FROM sos_events")
        await conn.execute("DELETE FROM daily_penalties")
        await conn.execute("DELETE FROM invoices")
        await conn.execute("DELETE FROM vehicles")
        await conn.execute("DELETE FROM geofences")
        await conn.execute("DELETE FROM users")
        await conn.execute("DELETE FROM vendors")

        print("Seeding vendors...")
        vendor1_id = await conn.fetchval("""
            INSERT INTO vendors (name, email, contact_phone)
            VALUES ('Tata Minerals Transport', 'admin@tataminerals.com', '+919876543210')
            RETURNING id
        """)
        vendor2_id = await conn.fetchval("""
            INSERT INTO vendors (name, email, contact_phone)
            VALUES ('JSW Logistics Pvt Ltd', 'ops@jswlogistics.com', '+919823456789')
            RETURNING id
        """)
        print(f"  Created vendors: {vendor1_id}, {vendor2_id}")

        print("Seeding supervisor and admin users...")
        supervisor_id = await conn.fetchval("""
            INSERT INTO users (name, phone, role, language_pref, hashed_password)
            VALUES ('Rajesh Kumar', '+919000000001', 'supervisor', 'hi', $1)
            RETURNING id
        """, hash_password("supervisor123"))

        admin_id = await conn.fetchval("""
            INSERT INTO users (name, phone, role, language_pref, hashed_password)
            VALUES ('SAIL Admin', '+919000000000', 'admin', 'en', $1)
            RETURNING id
        """, hash_password("admin123"))
        print(f"  Supervisor: {supervisor_id}")
        print(f"  Admin: {admin_id}")

        print("Seeding 10 driver users...")
        drivers = [
            ("Suresh Yadav",     "+919111111001", vendor1_id, "hi"),
            ("Ramesh Gupta",     "+919111111002", vendor1_id, "hi"),
            ("Manoj Sharma",     "+919111111003", vendor1_id, "hi"),
            ("Arjun Mahato",     "+919111111004", vendor1_id, "bn"),
            ("Vikram Singh",     "+919111111005", vendor1_id, "hi"),
            ("Pranab Das",       "+919111111006", vendor2_id, "bn"),
            ("Sanjay Oraon",     "+919111111007", vendor2_id, "or"),
            ("Dilip Kumar",      "+919111111008", vendor2_id, "hi"),
            ("Ravi Prasad",      "+919111111009", vendor2_id, "hi"),
            ("Amit Tirkey",      "+919111111010", vendor2_id, "or"),
        ]
        driver_ids = []
        for name, phone, vendor_id, lang in drivers:
            driver_id = await conn.fetchval("""
                INSERT INTO users (name, phone, role, vendor_id, language_pref, hashed_password)
                VALUES ($1, $2, 'driver', $3, $4, $5)
                RETURNING id
            """, name, phone, vendor_id, lang, hash_password("driver123"))
            driver_ids.append(driver_id)
        print(f"  Created {len(driver_ids)} drivers")

        print("Seeding 8 vehicles...")
        vehicles = [
            ("JH01AB1234", "coal_truck",      vendor1_id, driver_ids[0]),
            ("JH01AB1235", "coal_truck",      vendor1_id, driver_ids[1]),
            ("JH01AB1236", "tipper",          vendor1_id, driver_ids[2]),
            ("JH01AB1237", "ash_hauler",      vendor1_id, driver_ids[3]),
            ("JH01CD5678", "coal_truck",      vendor2_id, driver_ids[5]),
            ("JH01CD5679", "tipper",          vendor2_id, driver_ids[6]),
            ("JH01CD5680", "service_vehicle", vendor2_id, driver_ids[7]),
            ("JH01CD5681", "forklift",        vendor2_id, driver_ids[8]),
        ]
        vehicle_ids = []
        for plate, vtype, vendor_id, driver_id in vehicles:
            vehicle_id = await conn.fetchval("""
                INSERT INTO vehicles (license_plate, vehicle_type, vendor_id, assigned_driver_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            """, plate, vtype, vendor_id, driver_id)
            vehicle_ids.append(vehicle_id)
        print(f"  Created {len(vehicle_ids)} vehicles")

        print("Seeding 3 geofence zones...")
        # SAIL RDCIS Ranchi approximate coordinates
        # Main road zone
        main_road_polygon = "POLYGON((85.3180 23.3440, 85.3200 23.3440, 85.3200 23.3420, 85.3180 23.3420, 85.3180 23.3440))"
        # Coal yard - lower speed limit
        coal_yard_polygon = "POLYGON((85.3160 23.3435, 85.3175 23.3435, 85.3175 23.3425, 85.3160 23.3425, 85.3160 23.3435))"
        # Pedestrian crossing - very low speed limit with time rules
        pedestrian_polygon = "POLYGON((85.3188 23.3432, 85.3193 23.3432, 85.3193 23.3429, 85.3188 23.3429, 85.3188 23.3432))"

        time_rules_pedestrian = json.dumps({
            "day": {"start": "06:00", "end": "18:00", "limit": 15},
            "night": {"start": "18:00", "end": "06:00", "limit": 10}
        })

        gf1_id = await conn.fetchval("""
            INSERT INTO geofences (name, zone_type, speed_limit, polygon, time_rules, created_by)
            VALUES ('Main Plant Road', 'main_road', 50,
                    ST_GeomFromText($1, 4326), '{}', $2)
            RETURNING id
        """, main_road_polygon, supervisor_id)

        gf2_id = await conn.fetchval("""
            INSERT INTO geofences (name, zone_type, speed_limit, polygon, time_rules, created_by)
            VALUES ('Coal Yard Zone', 'coal_yard', 30,
                    ST_GeomFromText($1, 4326), '{}', $2)
            RETURNING id
        """, coal_yard_polygon, supervisor_id)

        gf3_id = await conn.fetchval("""
            INSERT INTO geofences (name, zone_type, speed_limit, polygon, time_rules, created_by)
            VALUES ('Pedestrian Crossing Gate 3', 'pedestrian', 15,
                    ST_GeomFromText($1, 4326), $2, $3)
            RETURNING id
        """, pedestrian_polygon, time_rules_pedestrian, supervisor_id)

        print(f"  Main Road (50 km/h): {gf1_id}")
        print(f"  Coal Yard (30 km/h): {gf2_id}")
        print(f"  Pedestrian Gate (15 km/h): {gf3_id}")

        print("\n✅ Seed data loaded successfully!")
        print("\n📋 Login Credentials:")
        print("  Admin:      phone=+919000000000  password=admin123")
        print("  Supervisor: phone=+919000000001  password=supervisor123")
        print("  Driver 1:   phone=+919111111001  password=driver123")
        print("  Driver 2:   phone=+919111111002  password=driver123")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed())