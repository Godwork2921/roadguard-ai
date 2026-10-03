# Database

## Where the schema actually lives

Flyway migrations are versioned **with the backend**, not here:

```
backend/roadguard-api/src/main/resources/db/migration/
└── V1__initial_schema.sql
```

This is deliberate. A migration that has been applied is part of the
application's history; moving it to a separate directory invites the two copies
drifting apart, and it keeps migrations reviewable in the same pull request as
the entity changes that depend on them.

New migrations go in that directory as `V2__…`, `V3__…`, and so on. Never edit
`V1__initial_schema.sql` once it has been applied anywhere — add a new version
instead.

## What lives here

`scripts/seed.sql` — development seed data. It targets the `public` schema
because V1 creates tables unqualified, is idempotent, and is validated against
the real schema.

Apply it after Flyway has migrated:

```bash
Get-Content database/scripts/seed.sql -Raw |
  docker compose exec -T postgres psql -U roadguard -d roadguard -v ON_ERROR_STOP=1
```

## Bootstrap scripts

`infrastructure/scripts/init-db.sh` runs once on first boot and prepares only
what Flyway cannot: PostGIS extensions, the separate `keycloak` database, and the
`roadguard_readonly` role. It never creates tables.

## Storage responsibilities

| Store | Holds | Notes |
|-------|-------|-------|
| PostgreSQL + PostGIS | Durable domain state | Source of truth |
| Redis | Live state only | Proximity search, rate limits, caching — never durable |
| Kafka | Asynchronous events | Hazard reports, telemetry |
| Object storage | Media and models | `roadguard-hazards`, `roadguard-ai` buckets |