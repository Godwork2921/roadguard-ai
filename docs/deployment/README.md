# Deployment

Reserved for deployment and operational runbooks.

Current deployment entrypoints:

- `infrastructure/scripts/deploy.sh` — start/stop/rollback/status of the stack
- `docker-compose.yml` — base topology
- `docker-compose.dev.yml` — development overlay (JVM debug, verbose logging)
- `docker-compose.prod.yml` — production overlay (required secrets, TLS, replicas, resource limits)
- `infrastructure/ssl/README.md` — TLS certificate provisioning

The production overlay **fails fast** if a required secret is unset rather than
falling back to a development default. That behaviour is intentional and should
not be relaxed.

Runbooks still to be written: database backup and restore, Kafka consumer lag,
MinIO bucket recovery, and Keycloak realm re-import.