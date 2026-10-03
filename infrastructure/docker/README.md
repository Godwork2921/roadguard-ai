# Docker

Reserved for Dockerfiles and image definitions that are shared across services.

Each service currently owns its own Dockerfile next to its source, which is the
right default — the build context for a Maven or Python project is the module
directory, so the Dockerfile has to live there for `.dockerignore` to work
correctly:

- `backend/roadguard-api/Dockerfile`
- `apps/ai/ai-service/Dockerfile`

Move a Dockerfile here only when it genuinely serves more than one service.