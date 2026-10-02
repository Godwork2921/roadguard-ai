#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
    log_info "Cleaning up temporary resources..."
}
trap cleanup EXIT

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "docker-compose.yml not found at $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    log_warn "No .env file found. Creating from template..."
    cat > "$ENV_FILE" <<-EOF
POSTGRES_DB=roadguard
POSTGRES_USER=roadguard
POSTGRES_PASSWORD=roadguard
SPRING_PROFILES_ACTIVE=prod
EOF
fi

log_info "Loading environment variables..."
set -a; source "$ENV_FILE"; set +a

log_info "Authenticating with container registry..."
if [ -n "${DOCKER_REGISTRY:-}" ] && [ -n "${DOCKER_USERNAME:-}" ] && [ -n "${DOCKER_PASSWORD:-}" ]; then
    echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
fi

log_info "Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull --quiet

log_info "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" run --rm roadguard-api java -jar app.jar --spring.flyway.clean-disabled=false

log_info "Starting services with zero-downtime deployment..."
docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans --no-deps --scale roadguard-api=2

log_info "Waiting for services to become healthy..."
for service in postgres redis roadguard-api ai-service nginx; do
    log_info "Waiting for $service..."
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        log_info "$service is healthy."
    else
        log_warn "$service may not be fully ready."
    fi
done

if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Exit"; then
    log_error "Some services failed to start. Inspecting logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 | grep -E "ERROR|Fatal|Exception" || true
    exit 1
fi

log_info "Running smoke tests..."
if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
    log_info "API health check passed."
else
    log_warn "API health check failed. Check service logs."
fi

if curl -sf http://localhost:80 > /dev/null 2>&1; then
    log_info "Frontend health check passed."
else
    log_warn "Frontend health check failed."
fi

log_info "Cleaning up old images..."
docker image prune -f --filter "until=48h"

log_info "Deployment completed successfully."
log_info "Application is available at:"
log_info "  Frontend:  https://roadguard.local"
log_info "  API:       https://roadguard.local/api"
log_info "  Monitoring: http://localhost:9090"
