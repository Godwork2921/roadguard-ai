# Known Issues

Issues discovered while establishing the repository structure and infrastructure
stack in Phases 1–2. Each entry records what was observed, how it was verified,
and where the fix belongs.

Status legend: **Open** — not yet fixed. **Deferred** — intentionally left for a
later phase.

---

## 1. `ADMINISTRATOR` role does not exist in the backend enum — Open

`backend/roadguard-api/src/main/resources/db/migration/V1__initial_schema.sql`
seeds a bootstrap administrator:

```sql
INSERT INTO users (email, role, ...) VALUES ('admin@roadguard.ai', 'ADMINISTRATOR', ...);
```

But the Java enum declares only three roles:

- `backend/roadguard-api/src/main/java/.../entity/User.java` → `UserRole`
  declares `DRIVER`, `PASSENGER`, `AUTHORITY_OFFICER`

A third naming scheme already exists in `infrastructure/keycloak/roadguard-realm.json`,
which defines `DRIVER`, `AUTHORITY_OFFICER`, and `ADMIN` — matching the project
specification.

The consequence is that the role seeded in the database cannot be deserialised
into a `UserRole`, so the bootstrap admin cannot authenticate.

Three candidate resolutions:

1. Rename the enum constant to `ADMIN` and align the migration.
2. Rename the Keycloak realm role to `ADMINISTRATOR`.
3. Keep `ADMIN` in Keycloak as the external name and map it to an internal
   `ADMINISTRATOR` enum in the Spring resource-server configuration.

Option 3 is usually the most robust, because the external identity contract in
Keycloak then does not have to track internal refactors.

**Phase 4 (authentication and authorization)** owns this decision.

---

## 2. No organization / tenant table — Deferred

The specification requires multi-tenancy: Keycloak users carry an
`organization_id`, and every operational table is scoped to an organization.

`V1__initial_schema.sql` creates no `organizations` table and no
`organization_id` column. This is a large, coordinated change and is
intentionally deferred rather than patched into V1, which has already been
applied in development.

**Phase 4** should add `V2__add_organizations.sql` (plus row-level security
policies) rather than editing V1.

---

## 3. Spring Boot 3.4.4 on Java 24 is an unusual pairing — Deferred

`backend/roadguard-api/pom.xml` pins Spring Boot `3.4.4` with
`<java.version>24</java.version>`, and the Dockerfile builds on a Java 24 base
image.

Spring Boot 3.4.x is validated against Java 23; Java 24 support is properly
established in Spring Boot 3.5.x. The application currently builds and runs, but
the combination is outside the officially tested matrix, so an unexpected
compilation or runtime failure should not be assumed to be an application bug.

**Phase 3** should either move to a Spring Boot release that officially supports
Java 24, or drop the target to Java 21.

---

## 4. `maintenance_tasks.assigned_to` is inconsistent with the rest of the schema — Open

Almost every table uses UUID foreign keys with `assigned_by` / `assigned_to`.
`maintenance_tasks` breaks the pattern:

```sql
assigned_to  VARCHAR(200),   -- free-text assignee name
assigned_by  UUID,           -- ...but this one is a proper FK
```

`assigned_to` will most likely need to become a UUID reference to `users`, or be
renamed to make clear it holds a name/team rather than a principal. Until it is
decided, code touching this table must special-case it.

---

## 5. `ddl-auto: none` leaves schema drift undetected — Open

`application.yml` sets `spring.jpa.hibernate.ddl-auto: none`, which is correct
for production, but it means Hibernate validates nothing at startup. A column
added to an entity without a matching migration fails at the first query rather
than at boot.

The specification asks for `validate`. Switching to `validate` in the
application profile converts these failures into fast, clear startup errors.

**Phase 3** should set `ddl-auto: validate` in the local/development profile.

---

## 6. Kafka advertises a container-only listener — Open

`apache/kafka` is configured with `KAFKA_ADVERTISED_LISTENERS` set to the
internal `kafka:9092` address only. Tools running on the host (kafka-topics.sh
outside the container, local producers, tests) cannot connect.

This is correct and deliberate for the container-to-container path used by the
backend, but it must be extended with a second listener bound to the host before
any host-side tooling is expected to work.

---

## Verification notes

The infrastructure findings above were confirmed against a live stack:

| Component | Verified by |
|-----------|-------------|
| PostgreSQL/PostGIS | 8 extensions installed including `postgis` 3.4.3 (USE_GEOS, USE_PROJ); `ST_Buffer`/`ST_DWithin` execute correctly |
| `roadguard_readonly` | Role created by `init-db.sh` and confirmed present in `\du` |
| Keycloak | Realm `roadguard` imported; roles `DRIVER`, `AUTHORITY_OFFICER`, `ADMIN` present; `roadguard-api` client present; OIDC discovery reachable |
| Kafka | Topic created, and a produced message was consumed back |
| Redis | `GEOADD` + `GEOSEARCH` returned correct radius filtering and distances |
| `seed.sql` | Applied against `V1__initial_schema.sql` in a scratch database; exit 0; row counts stable across two runs |
| Spatial data | Risk-zone polygon areas within ~1% of πr², confirming the metre-based buffer is correct |
| S3 provisioning | `init-s3.sh` created both buckets against a live S3-compatible server, was idempotent on re-run, and fell back cleanly when the server rejected the location constraint |