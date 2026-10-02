# RoadGuard AI

AI-powered preventive road safety and smart mobility platform.

## Prerequisites

- **Java 21+** (for backend)
- **Node.js 20+** (for frontend)
- **Python 3.11+** (for AI service)
- **Docker Desktop** (for PostgreSQL, Redis — or run them natively)
- **Maven 3.9+** (or use `mvnw` after generating it)

---

## Quick Start (Full Stack with Docker)

```bash
# 1. Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# 2. Start the backend
cd backend\roadguard-api
mvn spring-boot:run

# 3. Start the frontend (in a new terminal)
cd frontend
npm install
npm run dev

# 4. Start the AI service (in a new terminal)
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Backend API:** http://localhost:8080/swagger-ui.html  
**Frontend:** http://localhost:5173  
**AI Service:** http://localhost:8000/docs

---

## Option 2: Everything with Docker Compose

```bash
# Build and start all services
docker compose up --build
```

This starts: PostgreSQL, Redis, Backend API, AI Service, Nginx.

---

## Run Individual Components

### Backend (Spring Boot)

```bash
cd backend\roadguard-api

# Generate Maven wrapper (first time only)
mvn wrapper:wrapper -Dmaven=3.9.6

# Run with dev profile
mvn spring-boot:run

# Or build and run the JAR
mvn package -DskipTests
java -jar target\roadguard-api-1.0.0.jar
```

Requires PostgreSQL and Redis running (use `docker compose up -d postgres redis`).

### Frontend (React)

```bash
cd frontend
npm install
npm run dev        # Development server on :5173
npm run build      # Production build to dist/
```

### AI Service (Python FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Android App

Open `android/` in Android Studio. Build and run on device/emulator.

---

## Configuration

| Component | Config File | Key Settings |
|-----------|-----------|--------------|
| Backend | `application.yml` | DB connection, Redis, JWT secret, AI service URL |
| Frontend | `.env` | API base URL, map tiles, OSRM URL |
| AI Service | `.env` | Model path, confidence threshold |
| Docker | `docker-compose.yml` | Ports, volumes, environment |

---

## Default Admin Credentials

- **Email:** admin@roadguard.ai
- **Password:** admin123
- **Role:** ADMINISTRATOR

---

## API Documentation

Once the backend is running:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## Health Checks

- Backend: http://localhost:8080/actuator/health
- AI Service: http://localhost:8000/api/v1/health
