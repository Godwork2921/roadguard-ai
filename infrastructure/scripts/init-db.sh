#!/bin/bash
set -euo pipefail

POSTGRES_USER="${POSTGRES_USER:-roadguard}"
POSTGRES_DB="${POSTGRES_DB:-roadguard}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting database initialization..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Enable PostGIS extensions
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
    CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
    CREATE EXTENSION IF NOT EXISTS uuid-ossp;
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Create schemas
    CREATE SCHEMA IF NOT EXISTS roadguard;
    CREATE SCHEMA IF NOT EXISTS audit;

    -- Create read-only user for reporting
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'roadguard_readonly') THEN
            CREATE ROLE roadguard_readonly WITH LOGIN PASSWORD 'roadguard_readonly';
            GRANT CONNECT ON DATABASE roadguard TO roadguard_readonly;
            GRANT USAGE ON SCHEMA roadguard TO roadguard_readonly;
            GRANT SELECT ON ALL TABLES IN SCHEMA roadguard TO roadguard_readonly;
            GRANT SELECT ON ALL SEQUENCES IN SCHEMA roadguard TO roadguard_readonly;
            ALTER DEFAULT PRIVILEGES IN SCHEMA roadguard GRANT SELECT ON TABLES TO roadguard_readonly;
        END IF;
    END
    \$\$;

    -- Verify extensions
    SELECT name, default_version, installed_version
    FROM pg_available_extensions
    WHERE installed_version IS NOT NULL
    ORDER BY name;

    -- Log completion
    RAISE NOTICE 'Database initialization complete';
EOSQL

log "PostGIS extensions and schemas created successfully."
