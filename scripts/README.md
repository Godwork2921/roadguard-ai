# Scripts

Reserved for repository-level developer and CI entrypoints that do not belong to
any single application.

Anything that operates on a specific service should live with that service
instead — `infrastructure/scripts/` holds the database and object-store
provisioning scripts, and each application keeps its own tooling alongside its
code.