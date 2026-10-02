-- RoadGuard AI - Initial Database Schema
-- PostgreSQL 16+ with PostGIS 3.4+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP,
    fcm_token VARCHAR(500),
    region VARCHAR(100),
    vehicle_info VARCHAR(1000),
    role VARCHAR(50) NOT NULL DEFAULT 'DRIVER',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_region ON users(region) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE TABLE user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    device_info VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
-- VEHICLES
-- ============================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plate_number VARCHAR(50),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    vehicle_type VARCHAR(50) DEFAULT 'CAR',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_vehicles_user ON vehicles(user_id) WHERE deleted_at IS NULL;

-- ============================================================
-- TRIPS & GPS
-- ============================================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_point GEOMETRY(POINT, 4326),
    end_point GEOMETRY(POINT, 4326),
    start_address VARCHAR(500),
    end_address VARCHAR(500),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    total_distance DOUBLE PRECISION,
    average_speed DOUBLE PRECISION,
    max_speed DOUBLE PRECISION,
    is_offline BOOLEAN NOT NULL DEFAULT FALSE,
    is_synced BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_trips_driver ON trips(driver_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_status ON trips(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trips_start_point ON trips USING GIST(start_point);
CREATE INDEX idx_trips_end_point ON trips USING GIST(end_point);

CREATE TABLE trip_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    direction DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    accuracy REAL,
    bearing REAL,
    timestamp TIMESTAMP NOT NULL,
    point GEOMETRY(POINT, 4326),
    is_offline BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_trip_locations_trip ON trip_locations(trip_id);
CREATE INDEX idx_trip_locations_ts ON trip_locations(timestamp);
CREATE INDEX idx_trip_locations_trip_ts ON trip_locations(trip_id, timestamp);
CREATE INDEX idx_trip_locations_point ON trip_locations USING GIST(point);

-- ============================================================
-- ROUTE ANALYSIS
-- ============================================================

CREATE TABLE route_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    start_point GEOMETRY(POINT, 4326),
    end_point GEOMETRY(POINT, 4326),
    start_address VARCHAR(500),
    end_address VARCHAR(500),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    total_distance DOUBLE PRECISION,
    estimated_duration BIGINT,
    hazard_count INTEGER DEFAULT 0,
    safe_route BOOLEAN DEFAULT TRUE,
    route_geometry GEOMETRY(LINESTRING, 4326),
    alternative_routes INTEGER DEFAULT 0,
    analysis_status VARCHAR(50) DEFAULT 'PENDING',
    error_message TEXT,
    requested_at TIMESTAMP,
    completed_at TIMESTAMP,
    cached_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_route_analyses_user ON route_analyses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_route_analyses_status ON route_analyses(analysis_status);
CREATE INDEX idx_route_analyses_geom ON route_analyses USING GIST(route_geometry);

-- ============================================================
-- HAZARDS
-- ============================================================

CREATE TABLE hazards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOMETRY(POINT, 4326),
    description VARCHAR(1000),
    address VARCHAR(500),
    confidence_score DOUBLE PRECISION,
    reported_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes VARCHAR(2000),
    is_ai_detected BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'MANUAL',
    region VARCHAR(100),
    road_name VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_hazards_status ON hazards(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_hazards_severity ON hazards(severity);
CREATE INDEX idx_hazards_location ON hazards USING GIST(location);
CREATE INDEX idx_hazards_reported ON hazards(reported_by);
CREATE INDEX idx_hazards_type ON hazards(hazard_type);
CREATE INDEX idx_hazards_region ON hazards(region);
CREATE INDEX idx_hazards_active ON hazards(status) WHERE status IN ('REPORTED','VERIFIED','ASSIGNED') AND deleted_at IS NULL;

CREATE TABLE hazard_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_id UUID NOT NULL REFERENCES hazards(id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    image_type VARCHAR(50) DEFAULT 'EVIDENCE',
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_hazard_images_hazard ON hazard_images(hazard_id);

CREATE TABLE hazard_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_id UUID NOT NULL REFERENCES hazards(id) ON DELETE CASCADE,
    verified_by_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    notes VARCHAR(1000),
    verified_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_hazard_verifications_hazard ON hazard_verifications(hazard_id);

CREATE TABLE maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_id UUID NOT NULL REFERENCES hazards(id) ON DELETE CASCADE,
    assigned_to VARCHAR(200),
    assigned_by UUID,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    scheduled_date DATE,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_maintenance_hazard ON maintenance_tasks(hazard_id);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);

-- ============================================================
-- RISK ZONES
-- ============================================================

CREATE TABLE risk_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    zone_geometry GEOMETRY(POLYGON, 4326),
    hazard_count INTEGER DEFAULT 0,
    incident_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    region VARCHAR(100),
    last_incident_at TIMESTAMP,
    color_code VARCHAR(10) DEFAULT '#FF6B35',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_risk_zones_active ON risk_zones(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_risk_zones_geom ON risk_zones USING GIST(zone_geometry);
CREATE INDEX idx_risk_zones_region ON risk_zones(region);

-- ============================================================
-- ANOMALY EVENTS
-- ============================================================

CREATE TABLE anomaly_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    point GEOMETRY(POINT, 4326),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) DEFAULT 'MEDIUM',
    speed DOUBLE PRECISION,
    acceleration DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    driver_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id),
    device_id VARCHAR(200),
    confidence_score DOUBLE PRECISION,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_hazard_created BOOLEAN NOT NULL DEFAULT FALSE,
    weather_condition VARCHAR(100),
    road_condition VARCHAR(100),
    description VARCHAR(1000),
    raw_sensor_data JSONB,
    detected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_anomaly_point ON anomaly_events USING GIST(point);
CREATE INDEX idx_anomaly_detected ON anomaly_events(detected_at);
CREATE INDEX idx_anomaly_verified ON anomaly_events(is_verified);
CREATE INDEX idx_anomaly_trip ON anomaly_events(trip_id);
CREATE INDEX idx_anomaly_driver ON anomaly_events(driver_id);
CREATE INDEX idx_anomaly_type ON anomaly_events(anomaly_type);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    image_url VARCHAR(500),
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    channel VARCHAR(50) DEFAULT 'IN_APP',
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    UNIQUE(user_id, type)
);

CREATE INDEX idx_notif_pref_user ON notification_preferences(user_id);

-- ============================================================
-- SYSTEM CONFIG & AUDIT
-- ============================================================

CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(200) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(500),
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    data_type VARCHAR(50) DEFAULT 'STRING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    details VARCHAR(2000),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO permissions (id, name, description) VALUES
    (uuid_generate_v4(), 'VIEW_HAZARDS', 'View hazard reports'),
    (uuid_generate_v4(), 'REPORT_HAZARD', 'Report new hazards'),
    (uuid_generate_v4(), 'VERIFY_HAZARD', 'Verify hazard reports'),
    (uuid_generate_v4(), 'ASSIGN_HAZARD', 'Assign hazards to teams'),
    (uuid_generate_v4(), 'RESOLVE_HAZARD', 'Resolve hazards'),
    (uuid_generate_v4(), 'VIEW_ANALYTICS', 'View analytics dashboard'),
    (uuid_generate_v4(), 'MANAGE_USERS', 'Manage user accounts'),
    (uuid_generate_v4(), 'MANAGE_CONFIG', 'Manage system configuration'),
    (uuid_generate_v4(), 'VIEW_AUDIT', 'View audit logs'),
    (uuid_generate_v4(), 'MANAGE_ROLES', 'Manage user roles');

INSERT INTO system_config (config_key, config_value, description, data_type) VALUES
    ('hazard.detection.confidence.threshold', '0.8', 'Minimum confidence for auto-accepted AI hazard detection', 'DOUBLE'),
    ('route.analysis.cache.ttl', '300', 'Route analysis cache TTL in seconds', 'INTEGER'),
    ('anomaly.detection.min.vehicles', '3', 'Minimum vehicles exhibiting same anomaly to flag as hazard', 'INTEGER'),
    ('anomaly.detection.window.minutes', '15', 'Time window for anomaly grouping', 'INTEGER'),
    ('map.default.zoom', '12', 'Default map zoom level', 'INTEGER'),
    ('map.default.center.lat', '9.03', 'Default map center latitude (Addis Ababa)', 'DOUBLE'),
    ('map.default.center.lng', '38.74', 'Default map center longitude (Addis Ababa)', 'DOUBLE'),
    ('gps.update.interval.seconds', '5', 'GPS location update interval', 'INTEGER'),
    ('sync.batch.size', '100', 'Maximum records per sync batch', 'INTEGER'),
    ('app.name', 'RoadGuard AI', 'Application display name', 'STRING'),
    ('app.contact.email', 'support@roadguard.ai', 'Support email address', 'STRING'),
    ('maintenance.mode', 'false', 'Enable maintenance mode', 'BOOLEAN');

-- Insert admin user (password: admin123 - CHANGE IN PRODUCTION)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, is_email_verified)
VALUES (
    uuid_generate_v4(),
    'admin@roadguard.ai',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System',
    'Admin',
    'ADMINISTRATOR',
    TRUE,
    TRUE
);
