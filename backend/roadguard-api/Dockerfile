# =============================================================================
# RoadGuard AI - backend/roadguard-api
#
# Build context MUST be ./backend/roadguard-api, because pom.xml lives there.
# (The previous context was ./backend with `COPY pom.xml .`, which could never
# work.) docker-compose.yml wires this up.
# =============================================================================

# pom.xml declares <java.version>24</java.version>; the builder and runtime
# images must both be >= 24 or `mvn package` fails on the release bytecode.
ARG JAVA_VERSION=24

# ---------- build ----------
FROM maven:3-eclipse-temurin-${JAVA_VERSION}-alpine AS builder

WORKDIR /build

# Dependency layer: cached until pom.xml actually changes.
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B \
 && cp target/roadguard-api-*.jar target/app.jar

# ---------- runtime ----------
FROM eclipse-temurin:${JAVA_VERSION}-jre-alpine

# curl is needed by the compose healthcheck
RUN apk add --no-cache curl \
 && addgroup -S roadguard \
 && adduser -S -G roadguard -h /app roadguard

WORKDIR /app

# Run unprivileged; writes only to /app which is owned by roadguard.
COPY --from=builder --chown=roadguard:roadguard /build/target/app.jar app.jar

USER roadguard

EXPOSE 8080

# SPRING_PROFILES_ACTIVE is deliberately NOT set here. A hardcoded default made
# every deployment - including `docker compose up` - run the production profile,
# which is the wrong default for a developer stack. Compose sets it explicitly:
# base = default, dev overlay = default, prod overlay = prod.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport"

# Container-aware heap: JVM reads MaxRAMPercentage, so no -Xmx hardcoding.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS http://localhost:8080/actuator/health || exit 1