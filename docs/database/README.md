# Database

Reserved for schema and data documentation.

The schema of record is
`backend/roadguard-api/src/main/resources/db/migration/V1__initial_schema.sql`,
which is applied by Flyway at backend startup. See
[`database/README.md`](../../database/README.md) for the migration layout and
seed data.

Material to add here: an entity-relationship diagram, the PostGIS conventions used
for geometry columns, and the tenant-isolation design once the `organizations`
table lands in Phase 4.