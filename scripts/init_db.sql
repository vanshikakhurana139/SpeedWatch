-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- VENDORS TABLE — Contractor companies whose drivers use system
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE — All system users (drivers, supervisors, admins)
-- ============================================================
CREATE TYPE user_role AS ENUM ('driver', 'supervisor', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'driver',
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    language_pref VARCHAR(10) DEFAULT 'en',
    hashed_password VARCHAR(255),
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLES TABLE — Vehicle registry
-- ============================================================
CREATE TYPE vehicle_type AS ENUM ('coal_truck', 'ash_hauler', 'tipper', 'forklift', 'service_vehicle', 'other');

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type vehicle_type NOT NULL DEFAULT 'other',
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GEOFENCES TABLE — Speed zone polygons drawn on map
-- ============================================================
CREATE TYPE zone_type AS ENUM ('main_road', 'coal_yard', 'ash_pond', 'pedestrian', 'gate', 'workshop', 'restricted');

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    zone_type zone_type NOT NULL DEFAULT 'main_road',
    speed_limit INTEGER NOT NULL DEFAULT 50,
    polygon GEOMETRY(Polygon, 4326) NOT NULL,
    time_rules JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast geofence lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_geofences_polygon ON geofences USING GIST(polygon);

-- ============================================================
-- TRIPS TABLE — Each driving session
-- ============================================================
CREATE TYPE trip_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE load_type AS ENUM ('empty', 'partial', 'full', 'hazardous');

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    max_speed FLOAT DEFAULT 0,
    total_distance FLOAT DEFAULT 0,
    total_penalty INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    path GEOMETRY(LineString, 4326),
    status trip_status DEFAULT 'active',
    load_type load_type DEFAULT 'empty',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on driver and vehicle for quick lookups
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- ============================================================
-- VIOLATIONS TABLE — Every speeding event
-- ============================================================
CREATE TYPE violation_type AS ENUM ('overspeed', 'harsh_driving', 'geofence_breach');

CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    speed_recorded FLOAT NOT NULL,
    zone_limit INTEGER NOT NULL,
    penalty_amount INTEGER NOT NULL,
    violation_number INTEGER NOT NULL,
    violation_type violation_type DEFAULT 'overspeed',
    location GEOMETRY(Point, 4326) NOT NULL,
    geofence_id UUID REFERENCES geofences(id) ON DELETE SET NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    synced_from_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index on violation location for map queries
CREATE INDEX IF NOT EXISTS idx_violations_location ON violations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_violations_driver ON violations(driver_id);
CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp);

-- ============================================================
-- INCIDENTS TABLE — Voice-logged incident reports from drivers
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    trip_id UUID REFERENCES trips(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    transcript TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIST(location);

-- ============================================================
-- DAILY PENALTIES TABLE — Summary per driver per day
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    vendor_id UUID REFERENCES vendors(id),
    date DATE NOT NULL,
    total_amount INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    invoiced BOOLEAN DEFAULT FALSE,
    UNIQUE(driver_id, date)
);

-- ============================================================
-- INVOICES TABLE — Monthly vendor penalty invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    month_year VARCHAR(7) NOT NULL,
    total_amount INTEGER DEFAULT 0,
    pdf_path TEXT,
    sent_at TIMESTAMPTZ,
    signature_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, month_year)
);

-- ============================================================
-- SOS EVENTS TABLE — Emergency alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS sos_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    trip_id UUID REFERENCES trips(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    location GEOMETRY(Point, 4326) NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sos_location ON sos_events USING GIST(location);