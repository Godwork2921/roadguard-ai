#!/bin/bash
# =============================================================================
# RoadGuard AI - PostgreSQL initialisation
#
# Runs once, on first container start, via /docker-entrypoint-initdb.d/.
#
# SCOPE: extensions only.
#   Tables and indexes are owned exclusively by Flyway
#   (backend/roadguard-api/src/main/resources/db/migration/).
#   Do NOT create tables here. See docs/database/schema.md.
#
# SCHEMA NOTE: V1__initial_schema.sql creates every table unqualified, i.e. in
#   the default `public` schema. This script therefore grants on `public`.
#   Do not introduce a `roadguard` schema without a matching Flyway migration
#   that sets search_path, or the backend will not find its tables.
# =============================================================================
set -euo pipefail

POSTGRES_USER="${POSTGRES_USER:-roadguard}"
POSTGRES_DB="${POSTGRES_DB:-roadguard}"
READONLY_ROLE="${READONLY_ROLE:-roadguard_readonly}"
KEYCLOAK_DB="${KEYCLOAK_DB:-keycloak}"

log() {
    echo "[init-db] $*"
}

log "Starting database initialisation for '${POSTGRES_DB}' as '${POSTGRES_USER}'..."

# -----------------------------------------------------------------------------
# Identity provider database.
#
# Keycloak owns its schema outright. It must NOT live in the application
# database, otherwise its schema migrations can collide with Flyway's.
# Created here because /docker-entrypoint-initdb.d only runs on first boot.
# -----------------------------------------------------------------------------
log "Creating identity provider database '${KEYCLOAK_DB}'..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" \
    -v kc_db="$KEYCLOAK_DB" <<-'EOSQL'
    SELECT 'CREATE DATABASE "' || :'kc_db' || '"'
    WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'kc_db')
    \gexec
EOSQL

# Extensions that MUST succeed - the application depends on them.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL'
    -- uuid_generate_v4() for all primary keys
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    -- gen_random_uuid(), digest() for audit integrity
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    -- GEOMETRY types + spatial indexing for trips/hazards/risk_zones/routes
    CREATE EXTENSION IF NOT EXISTS "postgis";
    -- topology support for network-constrained geometry (V1 declares it)
    CREATE EXTENSION IF NOT EXISTS "postgis_topology";
    -- GIN operator classes used by JSONB/array indexes
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    -- trigram search on hazard description / road_name
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

# Optional extensions: failure must not abort initialisation.
log "Installing optional extensions (non-fatal on failure)..."
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-'EOSQL' || log "WARN: pg_stat_statements not installed (needs shared_preload_libraries)"
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EOSQL

# Read-only role for reporting / analytics workloads.
#
# NOTE: psql does NOT substitute :'var' inside a dollar-quoted $$...$$ block, so
# CREATE ROLE cannot be issued from a DO block here. The format(...) + \gexec
# form below is used instead: the variable reference sits outside any
# dollar-quoted string, so psql expands it before the statement is parsed.
log "Configuring read-only role '${READONLY_ROLE}'..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v readonly_role="$READONLY_ROLE" \
    -v app_db="$POSTGRES_DB" <<-'EOSQL'
    SELECT format('CREATE ROLE %I WITH LOGIN', :'readonly_role')
    WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'readonly_role')
    \gexec

    GRANT CONNECT ON DATABASE :"app_db" TO :"readonly_role";
    GRANT USAGE ON SCHEMA public TO :"readonly_role";
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"readonly_role";
    GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO :"readonly_role";

    -- Apply to tables created later by Flyway.
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"readonly_role";
EOSQL

log "Installed extensions:"
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --tuples-only --no-align \
    -c "SELECT '  - ' || extname || ' ' || extversion FROM pg_extension ORDER BY extname;"

log "Database initialisation complete. Flyway owns all tables."