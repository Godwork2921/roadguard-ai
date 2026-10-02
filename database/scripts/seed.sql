-- ============================================================================
-- RoadGuard AI - Development Seed Data
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.users (id, email, password_hash, full_name, role, phone, avatar_url, is_active, created_at, updated_at)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'admin@roadguard.ai',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Alice Kamau',
     'ADMIN',
     '+254712345678',
     'https://ui-avatars.com/api/?name=Alice+Kamau&background=1a73e8&color=fff',
     TRUE,
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '2 days'),

    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'john.driver@roadguard.ai',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'John Mwangi',
     'DRIVER',
     '+254723456789',
     'https://ui-avatars.com/api/?name=John+Mwangi&background=34a853&color=fff',
     TRUE,
     NOW() - INTERVAL '60 days',
     NOW() - INTERVAL '1 day'),

    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'jane.waithaka@roadguard.ai',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Jane Waithaka',
     'DRIVER',
     '+254734567890',
     'https://ui-avatars.com/api/?name=Jane+Waithaka&background=34a853&color=fff',
     TRUE,
     NOW() - INTERVAL '45 days',
     NOW() - INTERVAL '12 hours'),

    ('d4e5f6a7-b8c9-0123-defa-234567890123',
     'authority@nairobi.go.ke',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Peter Ochieng',
     'AUTHORITY',
     '+254745678901',
     'https://ui-avatars.com/api/?name=Peter+Ochieng&background=ea4335&color=fff',
     TRUE,
     NOW() - INTERVAL '30 days',
     NOW() - INTERVAL '3 days');

-- ---------------------------------------------------------------------------
-- Hazard Reports
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.hazards (id, user_id, hazard_type, severity, title, description,
                               latitude, longitude, location_name, images, status,
                               reported_at, resolved_at, created_at, updated_at)
VALUES
    ('e5f6a7b8-c9d0-1234-efab-345678901234',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'POTHOLE', 'HIGH',
     'Deep pothole on Mombasa Road',
     'Large pothole approximately 1.5m wide and 30cm deep near the JKIA exit. Caused multiple tire blowouts this week.',
     -1.3192, 36.9275, 'Mombasa Road, near JKIA exit',
     ARRAY['https://storage.roadguard.ai/hazards/pothole-mombasa-rd-01.jpg'],
     'REPORTED',
     NOW() - INTERVAL '7 days',
     NULL,
     NOW() - INTERVAL '7 days',
     NOW() - INTERVAL '6 days'),

    ('f6a7b8c9-d0e1-2345-fabc-456789012345',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'FLOODING', 'CRITICAL',
     'Flash flooding on Haile Selassie Avenue',
     'Severe flooding after heavy rains. Water levels reached 1.2m. Multiple vehicles stranded. Road impassable.',
     -1.2833, 36.8217, 'Haile Selassie Avenue, CBD',
     ARRAY['https://storage.roadguard.ai/hazards/flood-haile-selassie-01.jpg',
           'https://storage.roadguard.ai/hazards/flood-haile-selassie-02.jpg'],
     'VERIFIED',
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '13 days',
     NOW() - INTERVAL '14 days',
     NOW() - INTERVAL '13 days'),

    ('a7b8c9d0-e1f2-3456-abcd-567890123456',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'ROAD_DAMAGE', 'MEDIUM',
     'Road surface deterioration on Waiyaki Way',
     'Multiple cracks and surface degradation extending 200m along the left lane near the ABC Place junction.',
     -1.2603, 36.7833, 'Waiyaki Way, near ABC Place',
     ARRAY['https://storage.roadguard.ai/hazards/road-damage-waiyaki-01.jpg'],
     'REPORTED',
     NOW() - INTERVAL '5 days',
     NULL,
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '4 days'),

    ('b8c9d0e1-f2a3-4567-bcde-678901234567',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'ACCIDENT', 'CRITICAL',
     'Multi-vehicle collision on Thika Road',
     'Chain collision involving 5 vehicles near the GSU roundabout. Three injuries reported. Two lanes blocked.',
     -1.2189, 36.8875, 'Thika Road, GSU roundabout',
     ARRAY['https://storage.roadguard.ai/hazards/accident-thika-rd-01.jpg'],
     'RESOLVED',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '1 day'),

    ('c9d0e1f2-a3b4-5678-cdef-789012345678',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'FALLEN_DEBRIS', 'LOW',
     'Tree branch blocking Langata Road',
     'Large tree branch fell across the service lane near the Carnivore grounds. Single lane affected.',
     -1.3333, 36.7500, 'Langata Road, near Carnivore',
     ARRAY['https://storage.roadguard.ai/hazards/debris-langata-01.jpg'],
     'RESOLVED',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '12 hours',
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '12 hours');

-- ---------------------------------------------------------------------------
-- Risk Zones
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.risk_zones (id, name, description, risk_level, zone_geometry,
                                  hazard_type, incident_count, last_incident_at, created_at, updated_at)
VALUES
    ('d0e1f2a3-b4c5-6789-defa-890123456789',
     'Mombasa Road Corridor',
     'High-risk corridor between JKIA and CBD. Frequent potholes and accidents during peak hours.',
     'HIGH',
     ST_GeomFromText('POLYGON((36.9200 -1.3100, 36.9400 -1.3100, 36.9400 -1.3300, 36.9200 -1.3300, 36.9200 -1.3100))', 4326),
     'POTHOLE',
     47,
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '7 days'),

    ('e1f2a3b4-c5d6-7890-efab-901234567890',
     'CBD Flood Zone',
     'Low-lying areas in Nairobi CBD prone to flash flooding during heavy rains.',
     'CRITICAL',
     ST_GeomFromText('POLYGON((36.8150 -1.2780, 36.8300 -1.2780, 36.8300 -1.2900, 36.8150 -1.2900, 36.8150 -1.2780))', 4326),
     'FLOODING',
     23,
     NOW() - INTERVAL '3 days',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '7 days'),

    ('f2a3b4c5-d6e7-8901-fabc-012345678901',
     'Thika Road Accident Zone',
     'High-speed section near GSU roundabout with frequent chain collisions.',
     'HIGH',
     ST_GeomFromText('POLYGON((36.8820 -1.2150, 36.8950 -1.2150, 36.8950 -1.2250, 36.8820 -1.2250, 36.8820 -1.2150))', 4326),
     'ACCIDENT',
     31,
     NOW() - INTERVAL '2 days',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '7 days'),

    ('a3b4c5d6-e7f8-9012-abcd-123456789012',
     'Waiyaki Way Construction Zone',
     'Ongoing road construction with reduced lanes and uneven surfaces.',
     'MEDIUM',
     ST_GeomFromText('POLYGON((36.7780 -1.2560, 36.7880 -1.2560, 36.7880 -1.2650, 36.7780 -1.2650, 36.7780 -1.2560))', 4326),
     'ROAD_DAMAGE',
     15,
     NOW() - INTERVAL '5 days',
     NOW() - INTERVAL '60 days',
     NOW() - INTERVAL '14 days'),

    ('b4c5d6e7-f8a9-0123-bcde-234567890123',
     'Langata Road Low-Risk Zone',
     'Generally well-maintained road with minimal incidents.',
     'LOW',
     ST_GeomFromText('POLYGON((36.7450 -1.3280, 36.7580 -1.3280, 36.7580 -1.3400, 36.7450 -1.3400, 36.7450 -1.3280))', 4326),
     'FALLEN_DEBRIS',
     4,
     NOW() - INTERVAL '1 day',
     NOW() - INTERVAL '30 days',
     NOW() - INTERVAL '14 days');

-- ---------------------------------------------------------------------------
-- Trip Records
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.trips (id, user_id, start_location, end_location, start_lat, start_lng,
                             end_lat, end_lng, distance_km, duration_minutes, average_speed,
                             route_geometry, started_at, ended_at, score, hazards_encountered,
                             created_at)
VALUES
    ('c5d6e7f8-a9b0-1234-cdef-345678901234',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'Kiambu Road', 'Mombasa Road, JKIA',
     -1.1800, 36.8700, -1.3192, 36.9275,
     18.5, 45, 24.7,
     ST_GeomFromText('LINESTRING(36.8700 -1.1800, 36.8850 -1.2100, 36.9000 -1.2500, 36.9200 -1.2900, 36.9275 -1.3192)', 4326),
     NOW() - INTERVAL '3 days' - INTERVAL '45 minutes',
     NOW() - INTERVAL '3 days',
     72.5,
     2,
     NOW() - INTERVAL '3 days'),

    ('d6e7f8a9-b0c1-2345-defa-456789012345',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'Westlands', 'CBD, Haile Selassie Avenue',
     -1.2667, 36.8000, -1.2833, 36.8217,
     6.2, 25, 14.9,
     ST_GeomFromText('LINESTRING(36.8000 -1.2667, 36.8080 -1.2720, 36.8150 -1.2780, 36.8217 -1.2833)', 4326),
     NOW() - INTERVAL '5 days' - INTERVAL '25 minutes',
     NOW() - INTERVAL '5 days',
     55.0,
     1,
     NOW() - INTERVAL '5 days'),

    ('e7f8a9b0-c1d2-3456-efab-567890123456',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'CBD, Nairobi', 'Thika Road, GSU roundabout',
     -1.2820, 36.8220, -1.2189, 36.8875,
     12.8, 30, 25.6,
     ST_GeomFromText('LINESTRING(36.8220 -1.2820, 36.8400 -1.2600, 36.8550 -1.2400, 36.8700 -1.2250, 36.8875 -1.2189)', 4326),
     NOW() - INTERVAL '2 days' - INTERVAL '30 minutes',
     NOW() - INTERVAL '2 days',
     88.3,
     0,
     NOW() - INTERVAL '2 days'),

    ('f8a9b0c1-d2e3-4567-fabc-678901234567',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'Langata, Nairobi', 'Westlands, Nairobi',
     -1.3333, 36.7500, -1.2667, 36.8000,
     11.4, 35, 19.5,
     ST_GeomFromText('LINESTRING(36.7500 -1.3333, 36.7650 -1.3100, 36.7750 -1.2900, 36.7900 -1.2750, 36.8000 -1.2667)', 4326),
     NOW() - INTERVAL '1 day' - INTERVAL '35 minutes',
     NOW() - INTERVAL '1 day',
     91.2,
     0,
     NOW() - INTERVAL '1 day'),

    ('a9b0c1d2-e3f4-5678-abcd-789012345678',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'Thika, Nairobi', 'CBD, Nairobi',
     -1.2100, 36.8800, -1.2820, 36.8220,
     15.1, 40, 22.6,
     ST_GeomFromText('LINESTRING(36.8800 -1.2100, 36.8650 -1.2300, 36.8500 -1.2500, 36.8350 -1.2650, 36.8220 -1.2820)', 4326),
     NOW() - INTERVAL '12 hours' - INTERVAL '40 minutes',
     NOW() - INTERVAL '12 hours',
     65.8,
     1,
     NOW() - INTERVAL '12 hours');

-- ---------------------------------------------------------------------------
-- Hazard Tracks (trip-hazard associations)
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.trip_hazards (trip_id, hazard_id, proximity_meters, detected_at)
VALUES
    ('c5d6e7f8-a9b0-1234-cdef-345678901234',
     'e5f6a7b8-c9d0-1234-efab-345678901234',
     50,
     NOW() - INTERVAL '3 days' - INTERVAL '10 minutes'),

    ('d6e7f8a9-b0c1-2345-defa-456789012345',
     'f6a7b8c9-d0e1-2345-fabc-456789012345',
     30,
     NOW() - INTERVAL '5 days' - INTERVAL '5 minutes'),

    ('a9b0c1d2-e3f4-5678-abcd-789012345678',
     'b8c9d0e1-f2a3-4567-bcde-678901234567',
     100,
     NOW() - INTERVAL '12 hours' - INTERVAL '8 minutes');

-- ---------------------------------------------------------------------------
-- User Preferences (sample)
-- ---------------------------------------------------------------------------
INSERT INTO roadguard.user_preferences (user_id, notifications_enabled, preferred_radius_km,
                                        hazard_types_subscribed, alert_threshold, created_at, updated_at)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     TRUE, 5.0,
     ARRAY['POTHOLE', 'FLOODING', 'ACCIDENT'],
     'MEDIUM',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '2 days'),

    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',
     TRUE, 10.0,
     ARRAY['POTHOLE', 'ACCIDENT', 'ROAD_DAMAGE'],
     'HIGH',
     NOW() - INTERVAL '60 days',
     NOW() - INTERVAL '1 day'),

    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     TRUE, 8.0,
     ARRAY['FLOODING', 'ACCIDENT', 'FALLEN_DEBRIS'],
     'HIGH',
     NOW() - INTERVAL '45 days',
     NOW() - INTERVAL '12 hours'),

    ('d4e5f6a7-b8c9-0123-defa-234567890123',
     FALSE, 15.0,
     ARRAY['POTHOLE', 'FLOODING'],
     'LOW',
     NOW() - INTERVAL '30 days',
     NOW() - INTERVAL '3 days');

-- ---------------------------------------------------------------------------
-- Audit Log (sample entries)
-- ---------------------------------------------------------------------------
INSERT INTO audit.user_actions (user_id, action_type, entity_type, entity_id, old_value, new_value, ip_address, created_at)
VALUES
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CREATE', 'HAZARD', 'e5f6a7b8-c9d0-1234-efab-345678901234',
     NULL,
     '{"hazard_type":"POTHOLE","severity":"HIGH","location":"Mombasa Road, near JKIA exit"}',
     '192.168.1.100',
     NOW() - INTERVAL '7 days'),

    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'UPDATE', 'HAZARD', 'f6a7b8c9-d0e1-2345-fabc-456789012345',
     '{"status":"REPORTED"}',
     '{"status":"VERIFIED"}',
     '192.168.1.200',
     NOW() - INTERVAL '13 days'),

    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'DELETE', 'HAZARD', 'c9d0e1f2-a3b4-5678-cdef-789012345678',
     '{"status":"ACTIVE"}',
     '{"status":"RESOLVED"}',
     '192.168.1.50',
     NOW() - INTERVAL '12 hours');

COMMIT;

ANALYZE roadguard.users;
ANALYZE roadguard.hazards;
ANALYZE roadguard.risk_zones;
ANALYZE roadguard.trips;
ANALYZE roadguard.trip_hazards;
ANALYZE roadguard.user_preferences;
ANALYZE audit.user_actions;
