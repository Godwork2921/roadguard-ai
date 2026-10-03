# RoadGuard AI

AI-powered preventive road safety and smart mobility platform for Ethiopian road
authorities, drivers, and operators.

> **Status — Phases 1–2 complete.** The repository structure and the local
> infrastructure stack are in place and verified. The backend, web apps, mobile
> app, and AI service are pre-existing codebases carried over from before the
> restructure; their features are not yet implemented.

---

## Repository layout

```
roadguard-ai/
├── apps/
│   ├── web/
│   │   ├── authority-dashboard/   React SPA (authority officer + driver views)
│   │   └── admin-dashboard/       React SPA (administrator)  [Phase 11]
│   ├── mobile/
│   │   └── driver-app/            Android / Kotlin
│   └── ai/
│       └── ai-service/            FastAPI hazard-detection service
├── backend/
│   └── roadguard-api/             Spring Boot modular monolith (Java 24)
├── database/
│   ├── migrations/                (Flyway history is versioned with the backend)
│   └── scripts/                   seed.sql and dev helpers
├── infrastructure/
│   ├── docker/                    (reserved)
│   ├── keycloak/                  realm import
│   ├── nginx/                     HTTP + HTTPS vhosts
│   ├── monitoring/                Prometheus, Grafana, Loki, Tempo, OTel collector
│   ├── ssl/                       TLS certificate instructions
│   └── scripts/                   init-db.sh, init-s3.sh, deploy.sh
├── ml/                            training, notebooks, model registry
├── docs/                          architecture, api, database, deployment,
│                                  security, ai, product
├── scripts/                       (reserved)
└── docker-compose*.yml
```

`apps/web/authority-dashboard` currently contains the authority, admin, and
driver views in a single app. Splitting the admin dashboard into its own package
is scheduled for Phase 11.

---

## Prerequisites

- **Docker Desktop** with Compose v2 (the supported way to run everything)
- **Java 24+** and **Maven 3.9+** — only if running the backend outside Docker
- **Node.js 20+** — only for local frontend development
- **Python 3.11+** — only for local AI service development

The backend targets Java 24, so a Java 21 host will not build it. Running the
backend via Docker avoids this entirely.

---

## Quick start

```bash
# 1. Create your environment file (never commit this)
cp .env.example .env

# 2. Start the infrastructure
docker compose up -d postgres redis kafka keycloak minio minio-init

# 3. Confirm everything came up healthy
docker compose ps

# 4. Start the applications
docker compose up -d --build roadguard-api ai-service nginx
```

Compose provides three layers:

| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Base stack, development defaults |
| `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` | Adds verbose logging and JVM debug |
| `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` | Production: required secrets, TLS, resource limits, replica counts |

The production overlay **fails fast** if any required secret is missing rather
than silently falling back to a development default.

### Service endpoints

| Service | URL | Notes |
|---------|-----|-------|
| Nginx | http://localhost | API + SPA entry point |
| Keycloak | http://localhost:8081 | Realm `roadguard`, admin `admin` / `admin` |
| MinIO API | http://localhost:9000 | Buckets `roadguard-hazards`, `roadguard-ai` |
| MinIO console | http://localhost:9001 | Credentials from `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` |
| Backend | http://localhost:8080 | Swagger UI at `/swagger-ui.html` |
| AI service | http://localhost:8000 | OpenAPI docs at `/docs` |
| Prometheus | http://localhost:9090 | `--profile observability` |

---

## Data layer

Flyway owns the schema. `infrastructure/scripts/init-db.sh` runs once on first
boot and only prepares what Flyway cannot: PostGIS extensions, the separate
`keycloak` database, and the `roadguard_readonly` role. It never creates tables.

Seed data for development:

```bash
# Apply once Flyway has migrated (start the backend, or apply V1 manually)
Get-Content database/scripts/seed.sql -Raw |
  docker compose exec -T postgres psql -U roadguard -d roadguard -v ON_ERROR_STOP=1
```

`seed.sql` is idempotent — running it twice leaves the same row counts.

---

## Running components individually

### Backend

```bash
cd backend/roadguard-api
mvn spring-boot:run
```

Requires PostgreSQL and Redis. Reads configuration from `application.yml` with
environment variable overrides (`DB_HOST`, `REDIS_HOST`, `KEYCLOAK_ISSUER_URL`,
`S3_ENDPOINT_URL`, `KAFKA_BOOTSTRAP_SERVERS`, …).

### Web apps

```bash
cd apps/web/authority-dashboard
npm install
npm run dev     # http://localhost:5173
```

### AI service

```bash
cd apps/ai/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`CORS_ORIGINS` must list the calling origins. The default `*` is only combined
with `allow_credentials=False`, which is correct: browsers reject wildcard
origins on credentialed requests.

### Mobile app

Open `apps/mobile/driver-app` in Android Studio.

---

## Configuration

| Component | Config file | Notes |
|-----------|-------------|-------|
| Backend | `backend/roadguard-api/src/main/resources/application.yml` | Environment variables override every value |
| Web | `apps/web/*/.env` | API base URL, map tiles, routing URL |
| AI service | `apps/ai/ai-service/.env` | Model path, confidence threshold |
| Docker | `.env` + `docker-compose.yml` | Ports, credentials, image tags |

`.env.example` is the authoritative list of supported variables. `.env` is
git-ignored and must never be committed.

### Replacing the object store

`S3_IMAGE` and `S3_SERVER_ARGS` let you point the `minio` service at any
S3-compatible server (a mirror, S3Mock, LocalStack) without editing compose.
`S3_INIT_IMAGE` selects the client used by the one-shot bucket-provisioning job;
the default is the AWS CLI because it speaks plain S3 rather than MinIO's own
protocol.

---

## Keycloak

The `roadguard` realm is imported automatically on first boot from
`infrastructure/keycloak/roadguard-realm.json`, and defines the `DRIVER`,
`AUTHORITY_OFFICER`, and `ADMIN` roles plus the `roadguard-api` client.

Keycloak realm JSON is validated strictly — an unrecognised top-level key fails
the import and the server will not start. Keep annotations out of that file.

---

## Documentation

- `docs/architecture/` — system and data architecture
- `docs/api/` — API reference
- `docs/database/` — schema, migrations, seeding
- `docs/deployment/` — deployment and runbooks
- `docs/security/` — threat model, authentication, known issues
- `docs/ai/` — models and inference
- `docs/product/` — requirements and user-facing notes

---

## Known issues

See `docs/security/known-issues.md`. The most important one: `V1__initial_schema.sql`
seeds an admin with `role = 'ADMINISTRATOR'`, but the Java `UserRole` enum
declares only `DRIVER`, `PASSENGER`, and `AUTHORITY_OFFICER`, while the Keycloak
realm defines `DRIVER`, `AUTHORITY_OFFICER`, and `ADMIN`. These must be reconciled
before role-based access control is implemented in Phase 4.

---

## License

Proprietary. All rights reserved.