# Dev Container

Reserved for a VS Code / Codespaces dev container definition.

Intentionally left empty. Running the stack through `docker compose` from the host
is the supported path today, so there is no working dev container config to
preserve and writing an unverified one would be worse than none.

When one is added, two constraints have to be respected:

- **Java 24.** `backend/roadguard-api/pom.xml` sets `<java.version>24</java.version>`,
  so an image with Java 21 will not build the backend.
- **Docker socket access.** If the container is expected to run Compose itself,
  it needs the socket mounted — which effectively hands the container root on the
  host. Prefer connecting to the host's Compose network instead.