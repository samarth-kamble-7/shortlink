# Episode 1: Project Skeleton & Core Infrastructure

This guide provides the chapter breakdown, presenter script, code talking points, and verification commands for recording this milestone.

---

## Git Commit Details

- **Type:** `chore`
- **Scope:** `init`
- **Commit Summary:** `chore(init): setup project skeleton, docker-compose, and testcontainers smoke test`
- **Detailed Message:**
  ```text
  chore(init): setup project skeleton, docker-compose, and testcontainers smoke test

  - Add docker-compose.yml with postgres:16-alpine and pg_isready healthcheck
  - Configure application.yml with HikariCP (10/2), Flyway, UTC timezone, and Actuator
  - Enforce Hibernate ddl-auto: validate and open-in-view: false
  - Add SecurityConfig permitting initial development endpoints
  - Add PingController probe at GET /api/v1/ping
  - Add Testcontainers integration smoke test in ShortlinkApplicationTests
  - Add package structure under com.shortlink (api, service, idgen, domain, config)
  - Add architecture diagrams and documentation in README.md
  - Add Episode 1 video presenter guide in docs/
  ```

---

## Video Talking Points & Script

### 1. Hook & Introduction (00:00 - 01:30)
- **The Hook:** Don't just build another tutorial CRUD app. We are building **ShortLink**—a scalable, distributed URL shortener and real-time click analytics platform.
- **Why this project matters:** URL shorteners are the classic backend/distributed systems interview problem (handling millions of redirects with sub-10ms latency).
- **Architecture Highlights:**
  - 64-bit Twitter Snowflake ID generation + Base62 encoding
  - Multi-tier caching (Caffeine L1 + Redis L2)
  - Async click analytics streaming via Apache Kafka
  - Consistent-hash database sharding across PostgreSQL instances
  - Redis Token Bucket rate limiting via Lua scripts

---

### 2. File-by-File Walkthrough (01:30 - 06:00)

#### File 1: `docker-compose.yml`
- **What to show:** Open `docker-compose.yml`.
- **Key Talking Points:**
  - Pinned to `postgres:16-alpine` for lightweight, reproducible local development.
  - Notice the `healthcheck` block (`pg_isready -U shortlink -d shortlink`). This ensures our Spring Boot app never attempts to connect before PostgreSQL has finished initializing.

#### File 2: `src/main/resources/application.yml`
- **What to show:** Open `src/main/resources/application.yml`.
- **Key Talking Points:**
  - `jpa.hibernate.ddl-auto: validate`: **Crucial senior practice.** Never allow Hibernate to auto-generate or alter tables in production (`update` or `create`). Flyway migrations will be the single source of truth.
  - `jpa.open-in-view: false`: Closes database connections immediately after service transactions complete, rather than keeping connections open during HTTP response serialization. Prevents connection pool starvation.
  - `hibernate.jdbc.time_zone: UTC`: Enforces UTC across all database timestamps to avoid time skew when running across multiple servers.
  - `management.endpoints.web.exposure.include: health,info,metrics`: Exposes Spring Boot Actuator for health monitoring and Prometheus metrics.

#### File 3: Package Structure (Modular Monolith)
- **What to show:** Expand `src/main/java/com/shortlink` in the project explorer:
  - `api`: REST controllers and DTOs
  - `service`: Core business logic
  - `idgen`: Snowflake generator and Base62 encoding
  - `domain`: JPA entities and repository interfaces
  - `config`: Infrastructure, security, and bean configurations
- **Key Talking Points:**
  - We start as a **Modular Monolith**. Avoid premature microservices. Clean package boundaries ensure parts of the system (like the Kafka Analytics Consumer in Phase 3) can be extracted into standalone services effortlessly.

#### File 4: `SecurityConfig.java` & `PingController.java`
- **What to show:** Open `SecurityConfig.java` and `PingController.java`.
- **Key Talking Points:**
  - `spring-boot-starter-security` is present for future authentication (Phase 4). To unblock our initial APIs without 401 Unauthorized errors, `SecurityConfig` permits all requests and disables CSRF for REST endpoints.
  - `PingController` at `/api/v1/ping` provides an instant sanity-check probe to verify Tomcat and the web pipeline independently of database queries.

#### File 5: `ShortlinkApplicationTests.java` (Testcontainers)
- **What to show:** Open `src/test/java/com/shortlink/ShortlinkApplicationTests.java`.
- **Key Talking Points:**
  - Modern Spring Boot 3.1+ feature: `@ServiceConnection` with `@Testcontainers`.
  - Avoid H2 in-memory databases—their SQL dialect and indexing differ from PostgreSQL. Testcontainers spins up a real, disposable PostgreSQL container during tests with zero manual configuration.

---

### 3. Terminal Verification Demo (06:00 - 08:00)

Run these commands live to demonstrate verification:

1. **Verify Database Container Health:**
   ```bash
   docker compose ps
   ```
   *(Container status should display `healthy` on port 5432)*

2. **Run Integration Smoke Test:**
   ```bash
   ./mvnw test
   ```
   *(Show Maven console output pulling/running PostgreSQL container and achieving `BUILD SUCCESS`)*

3. **Verify Actuator Health Check:**
   ```bash
   curl -i http://localhost:8080/actuator/health
   ```
   *(Show HTTP 200 with database status `UP`)*

4. **Verify Ping Endpoint:**
   ```bash
   curl -i http://localhost:8080/api/v1/ping
   ```
   *(Show HTTP 200 returning `{"status":"ok","time":"..."}`)*
