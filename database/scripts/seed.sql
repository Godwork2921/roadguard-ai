-- =============================================================================
-- RoadGuard AI - Development seed data
-- =============================================================================
-- Run AFTER Flyway (V1__initial_schema.sql) has applied.
--
--   docker compose exec -T postgres psql -U roadguard -d roadguard \
--       < database/scripts/seed.sql
--
-- This script is IDEMPOTENT: safe to run repeatedly.
-- It targets the `public` schema because V1 creates all tables unqualified.
--
-- VALIDATED against V1__initial_schema.sql. Column names here must stay in sync
-- with that migration, or this file will fail loudly - that is intentional.
--
-- Known gap: V1 seeds an admin with role='ADMINISTRATOR', but the Java enum
-- UserRole only declares DRIVER, PASSENGER, AUTHORITY_OFFICER. See
-- docs/security/known-issues.md. This file therefore only seeds roles that
-- actually exist in the enum.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- -----------------------------------------------------------------------------
-- Users
-- Password for every demo account below is the bcrypt hash of: RoadGuard@2026
-- CHANGE THESE before any shared environment.
-- -----------------------------------------------------------------------------
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active,
                   is_email_verified, region, vehicle_info, role)
VALUES
    ('driver@roadguard.ai',
     '$2a$10$5JHPvyHhzGHrOBhTGxvOKeVsKUcpZbNPDSJXOT9cpWBBPnMUdNvxu',
     'Demo', 'Driver', '+251911000001', TRUE, TRUE, 'Addis Ababa',
     'Bluebird EV - AA-12345', 'DRIVER'),

    ('driver2@roadguard.ai',
     '$2a$10$5JHPvyHhzGHrOBhTGxvOKeVsKUcpZbNPDSJXOT9cpWBBPnMUdNvxu',
     'Sara', 'Mekonnen', '+251911000002', TRUE, TRUE, 'Addis Ababa',
     'Minibus - AA-88221', 'DRIVER'),

    ('officer@roadguard.ai',
     '$2a$10$5JHPvyHhzGHrOBhTGxvOKeVsKUcpZbNPDSJXOT9cpWBBPnMUdNvxu',
     'Demo', 'Officer', '+251911000003', TRUE, TRUE, 'Addis Ababa',
     NULL, 'AUTHORITY_OFFICER')
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Permissions granted to the authority officer
-- (permission rows themselves are seeded by V1)
-- -----------------------------------------------------------------------------
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u
JOIN permissions p
  ON p.name IN ('VIEW_HAZARDS', 'VERIFY_HAZARD', 'ASSIGN_HAZARD',
                'RESOLVE_HAZARD', 'VIEW_ANALYTICS')
WHERE u.email = 'officer@roadguard.ai'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Vehicles
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (user_id, plate_number, make, model, year, color,
                      vehicle_type, is_default)
SELECT u.id, 'AA-12345', 'Bluebird', 'EV', 2023, 'Blue', 'CAR', TRUE
FROM users u WHERE u.email = 'driver@roadguard.ai'
  AND NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.user_id = u.id);

INSERT INTO vehicles (user_id, plate_number, make, model, year, color,
                      vehicle_type, is_default)
SELECT u.id, 'AA-88221', 'Toyota', 'Coaster', 2021, 'White', 'BUS', TRUE
FROM users u WHERE u.email = 'driver2@roadguard.ai'
  AND NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.user_id = u.id);

-- -----------------------------------------------------------------------------
-- Hazards around Addis Ababa (Bole / Meskel / Piazza corridor)
-- Note: the `location` GEOMETRY is populated from lat/lng so the GiST index is
-- always consistent with the scalar columns the entity also reads.
-- -----------------------------------------------------------------------------
--
-- `location` is built inline from (longitude, latitude) - note the argument
-- order, ST_MakePoint takes lon first - so the GiST index can never drift out of
-- sync with the scalar columns. `reported_by`/`verified_by` are UUID foreign
-- keys, so the human-readable email in the VALUES list is resolved through a
-- join against `users` rather than being cast.
INSERT INTO hazards (hazard_type, severity, status, latitude, longitude, location,
                     description, address, confidence_score,
                     reported_by, verified_by, verified_at,
                     is_ai_detected, is_verified, source, region, road_name)
SELECT seed.hazard_type,
       seed.severity,
       seed.status,
       seed.latitude,
       seed.longitude,
       ST_SetSRID(ST_MakePoint(seed.longitude, seed.latitude), 4326),
       seed.description,
       seed.address,
       seed.confidence_score,
       reporter.id,
       CASE WHEN seed.is_verified THEN verifier.id END,
       CASE WHEN seed.is_verified THEN NOW() END,
       seed.is_ai_detected,
       seed.is_verified,
       seed.source,
       seed.region,
       seed.road_name
FROM (VALUES
    ('POTHOLE', 'HIGH', 'VERIFIED',  9.0192::double precision, 38.7525::double precision,
     'Severe pothole cluster on the left lane, ~2m wide',
     'Bole Road', 0.91::double precision, 'officer@roadguard.ai',
     FALSE, TRUE, 'MANUAL', 'Addis Ababa', 'Bole Road'),

    ('FLOOD', 'HIGH', 'REPORTED',  8.9780, 38.8180,
     'Waterlogging across both lanes after rainfall, ~30cm deep',
     'Meskel Square', 0.87::double precision, 'driver@roadguard.ai',
     FALSE, FALSE, 'MANUAL', 'Addis Ababa', 'Meskel Street'),

    ('ROAD_BLOCKAGE', 'MEDIUM', 'ASSIGNED', 9.0250, 38.7360,
     'Fallen branches partially blocking the shoulder',
     'Piazza Area', 0.74::double precision, 'driver2@roadguard.ai',
     FALSE, TRUE, 'MANUAL', 'Addis Ababa', 'Piazza Road'),

    ('ROAD_CRACK', 'LOW', 'REPORTED', 9.0420, 38.7100,
     'Longitudinal crack, no immediate action required',
     'Kazanchis', NULL::double precision, 'driver@roadguard.ai',
     FALSE, FALSE, 'MANUAL', 'Addis Ababa', 'Kazanchis Road'),

    ('POTHOLE', 'MEDIUM', 'DETECTED', 9.0110, 38.7600,
     'Detected from dashcam frame, pending human verification',
     'Airport Expressway', 0.83::double precision, NULL::varchar,
     TRUE, FALSE, 'AI', 'Addis Ababa', 'Airport Expressway')
) AS seed(hazard_type, severity, status, latitude, longitude, description,
          address, confidence_score, reported_by_email, is_ai_detected,
          is_verified, source, region, road_name)
LEFT JOIN users reporter ON reporter.email = seed.reported_by_email
LEFT JOIN users verifier ON verifier.email = 'officer@roadguard.ai'
WHERE NOT EXISTS (
    SELECT 1 FROM hazards h
    WHERE h.latitude = seed.latitude AND h.longitude = seed.longitude
);

-- -----------------------------------------------------------------------------
-- Risk zones
--
-- The polygon is derived from centre + radius at insert time. ST_Buffer is
-- given a geography rather than a geometry because radius_meters is in metres;
-- buffering the raw 4326 geometry would interpret the radius as degrees and
-- produce a polygon roughly 111320x too large. The result is cast back to
-- geometry to match the column's GEOMETRY(POLYGON, 4326) type.
-- -----------------------------------------------------------------------------
INSERT INTO risk_zones (name, description, center_lat, center_lng, radius_meters,
                        risk_level, zone_geometry, hazard_count, incident_count,
                        is_active, region, color_code)
SELECT seed.name,
       seed.description,
       seed.center_lat,
       seed.center_lng,
       seed.radius_meters,
       seed.risk_level,
       ST_Buffer(
           ST_SetSRID(ST_MakePoint(seed.center_lng, seed.center_lat), 4326)::geography,
           seed.radius_meters
       )::geometry,
       seed.hazard_count,
       seed.incident_count,
       TRUE,
       seed.region,
       seed.color_code
FROM (VALUES
    ('Bole Road Corridor', 'Repeated pothole and surface-damage reports',
     9.0192::double precision, 38.7525::double precision, 1200.0::double precision,
     'HIGH', 14, 31, 'Addis Ababa', '#DC2626'),

    ('Meskel Interchange', 'Flooding and congestion hotspot',
     8.9780, 38.8180, 900.0,
     'HIGH', 9, 22, 'Addis Ababa', '#EA580C'),

    ('Piazza Zone', 'Blockage and pedestrian-conflict area',
     9.0250, 38.7360, 700.0,
     'MEDIUM', 5, 12, 'Addis Ababa', '#F59E0B')
) AS seed(name, description, center_lat, center_lng, radius_meters,
          risk_level, hazard_count, incident_count, region, color_code)
WHERE NOT EXISTS (
    SELECT 1 FROM risk_zones rz WHERE rz.name = seed.name
);

-- -----------------------------------------------------------------------------
-- A completed trip with a GPS trail
-- -----------------------------------------------------------------------------
INSERT INTO trips (driver_id, start_point, end_point, start_address, end_address,
                   start_time, end_time, status, risk_score, total_distance,
                   average_speed, max_speed, is_offline, is_synced)
SELECT u.id,
       ST_SetSRID(ST_MakePoint(38.7460, 9.0300), 4326),
       ST_SetSRID(ST_MakePoint(38.7600, 9.0100), 4326),
       'Addis Ababa Bole', 'Piazza',
       NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '38 minutes',
       'COMPLETED', 62, 14.8, 23.4, 48.0, FALSE, TRUE
FROM users u
WHERE u.email = 'driver@roadguard.ai'
  AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.driver_id = u.id AND t.status = 'COMPLETED');

-- GPS trail for that trip: a straight-line interpolation with small jitter.
INSERT INTO trip_locations (trip_id, latitude, longitude, speed, direction,
                            accuracy, timestamp, point, is_offline)
SELECT t.id,
       9.0300 + (9.0100 - 9.0300) * (i / 10.0),
       38.7460 + (38.7600 - 38.7460) * (i / 10.0),
       18.0 + (i * 1.4),
       135.0,
       6.0,
       t.start_time + (i * 210) * INTERVAL '1 second',  -- ~3.5 min apart
       ST_SetSRID(ST_MakePoint(
           38.7460 + (38.7600 - 38.7460) * (i / 10.0),
           9.0300 + (9.0100 - 9.0300) * (i / 10.0)
       ), 4326),
       FALSE
FROM trips t
JOIN users u ON u.id = t.driver_id
CROSS JOIN generate_series(0, 10) AS i
WHERE u.email = 'driver@roadguard.ai'
  AND t.status = 'COMPLETED'
  AND NOT EXISTS (
      SELECT 1 FROM trip_locations tl WHERE tl.trip_id = t.id
  );

-- -----------------------------------------------------------------------------
-- Notification for the authority officer
-- -----------------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type, priority, channel)
SELECT u.id, 'High-risk zone detected',
       'Bole Road Corridor has been flagged as high risk after 14 recent reports.',
       'RISK_ZONE_UPDATE', 'HIGH', 'IN_APP'
FROM users u
WHERE u.email = 'officer@roadguard.ai'
  AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = u.id AND n.type = 'RISK_ZONE_UPDATE'
  );

COMMIT;

-- -----------------------------------------------------------------------------
-- Verification summary
-- -----------------------------------------------------------------------------
SELECT 'users'         AS entity, COUNT(*) AS rows FROM users
UNION ALL SELECT 'permissions',   COUNT(*) FROM permissions
UNION ALL SELECT 'vehicles',      COUNT(*) FROM vehicles
UNION ALL SELECT 'trips',         COUNT(*) FROM trips
UNION ALL SELECT 'trip_locations',COUNT(*) FROM trip_locations
UNION ALL SELECT 'hazards',       COUNT(*) FROM hazards
UNION ALL SELECT 'risk_zones',    COUNT(*) FROM risk_zones
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
ORDER BY entity;