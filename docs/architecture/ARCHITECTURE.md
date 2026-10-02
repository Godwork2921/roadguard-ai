# RoadGuard AI - System Architecture

## Overview

RoadGuard AI is a modular monolith backend with satellite frontend and mobile clients. The system is designed for 100K+ concurrent drivers with offline-first capability, real-time GPS tracking, AI-powered hazard detection, and predictive route safety analysis.

## Architecture Style: Modular Monolith

### Why Modular Monolith?
- Simplified deployment vs microservices
- Strong module boundaries enforced at compile time
- Easy refactoring to microservices later if needed
- Single deployable unit reduces operational complexity
- Direct in-process method calls for low-latency operations

### Module Dependency Rules
```
common ← auth ← user ← trip ← gps ← route
                  ↕          ↕
                hazard ← anomaly
                  ↕
            notification ← offline
                  ↕
            analytics ← map ← admin
                  ↕
              integration
```

- Modules depend only on `common` or modules "above" them
- No circular dependencies
- `integration` module bridges external services (AI, Maps, FCM)

## Four-Tier Architecture

### 1. Presentation Layer
- **Android App**: Kotlin + Jetpack Compose, offline-first with SQLite
- **Authority Dashboard**: React + TypeScript + Vite + TailwindCSS
- **Admin Dashboard**: React + TypeScript + Vite + TailwindCSS
- **REST API**: Spring Boot 3, OpenAPI 3.0

### 2. Application Layer (Business Logic)
- Spring Boot Services with domain-driven module design
- Event-driven inter-module communication via Spring ApplicationEvent
- CQRS-like read/write separation where beneficial
- Redis caching for high-frequency queries

### 3. AI & ML Layer
- **On-device**: TensorFlow Lite for real-time image inference
- **Server-side**: Python FastAPI service for anomaly detection
- **Async processing**: Event-driven hazard verification pipeline

### 4. Data Layer
- **PostgreSQL + PostGIS**: Structured data and geospatial queries
- **Redis**: Session cache, route cache, real-time tracking cache
- **SQLite (device)**: Offline-first local storage
- **Flyway**: Versioned database migrations

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Modular Monolith | Faster iteration, simpler ops, single deployment |
| UUID Primary Keys | Distributed-friendly, no sequential guessing |
| Soft Delete | Data recovery, audit trail |
| Event-Driven Modules | Loose coupling, async processing |
| Offline-First SQLite | Zero data loss in 2G/Edge areas |
| PostGIS | Native geospatial queries, spatial indexing |
| Redis | <5ms route analysis cache |
| JWT + Refresh Tokens | Stateless auth, mobile-friendly |

## Scalability Strategy

1. **Horizontal Scaling**: Stateless API behind Nginx load balancer
2. **Database**: PostgreSQL read replicas + connection pooling (HikariCP)
3. **Caching**: Redis cluster for route analysis, hazard queries
4. **Async Processing**: Hazard verification via event queues
5. **Static Assets**: CDN for map tiles, frontend bundles
