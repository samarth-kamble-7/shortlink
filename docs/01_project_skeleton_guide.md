# Episode 1: Project Skeleton & Core Infrastructure

This document contains the exact recording script, talking points, file walkthrough, and verification commands for Episode 1.

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

## Exact Recording Script & Walkthrough

### Step 1: The Chapter Title & Goal (15–20 Seconds)

**What to say:**

> "In this first commit, we are laying the foundational skeleton for ShortLink. Before writing any business logic, a senior engineer always sets up three things: containerized infrastructure, production-grade configuration, and automated integration testing."

---

### Step 2: Walkthrough of the Key Files (Show These on Screen)

#### 1. `docker-compose.yml`
- **What to show on screen:** Open `docker-compose.yml`.
- **What to say:**
  > "Instead of installing PostgreSQL directly on our host machine, we use Docker Compose with `postgres:16-alpine`. Notice the healthcheck with `pg_isready`: this guarantees the container is actually accepting connections before anything tries to connect to it."

#### 2. `application.yml`
- **What to show on screen:** Open `src/main/resources/application.yml`.
- **Key points to explain:**
  - **`ddl-auto: validate`**: "Never let Hibernate auto-create or alter tables in production (update or create). We set it to validate because Flyway will be our single source of truth for migrations."
  - **`open-in-view: false`**: "Spring Boot defaults open-in-view to true, which keeps the database connection open during HTTP JSON serialization. Turning it off releases the connection back to the HikariCP pool immediately after the service transaction ends."
  - **`time_zone: UTC`**: "URL shorteners handle time-based link expiries and click analytics. Locking the database and Hibernate to UTC prevents timezone bugs when running across multiple servers."

#### 3. Package Structure (Modular Monolith)
- **What to show on screen:** Expand `src/main/java/com/shortlink` in your IDE sidebar:
  - `api` $\rightarrow$ REST Controllers & Request/Response DTOs
  - `service` $\rightarrow$ Core business logic
  - `idgen` $\rightarrow$ Snowflake generator & Base62 encoder
  - `domain` $\rightarrow$ JPA entities & repositories
  - `config` $\rightarrow$ Infrastructure & Security
- **What to say:**
  > "We are following a Modular Monolith architecture. We don't jump straight into microservices on Day 1. Instead, we enforce clean package boundaries with single responsibilities so components can easily be extracted into independent services later (like the Kafka Analytics Consumer in Phase 3)."

#### 4. `SecurityConfig.java` & `PingController.java`
- **What to show on screen:** Open `SecurityConfig.java` and `PingController.java`.
- **What to say:**
  > "Because we have Spring Security in our classpath for future authentication in Phase 4, it secures everything by default. In SecurityConfig, we configure permitAll() and disable CSRF for REST APIs so our development endpoints are unblocked. We also added a simple PingController at `/api/v1/ping` as a lightweight sanity check to verify the web server is responsive."

#### 5. `ShortlinkApplicationTests.java` (Testcontainers)
- **What to show on screen:** Open `ShortlinkApplicationTests.java`.
- **What to say:**
  > "In modern backend development, we avoid in-memory databases like H2 because their SQL dialect differs from PostgreSQL. Using Testcontainers with `@ServiceConnection`, Spring Boot automatically spins up an ephemeral, real PostgreSQL Docker container to run our integration smoke tests with zero manual setup."

---

### Step 3: Terminal Demo (The Live Proof)

**What to run in your terminal to show viewers:**

1. **Show the healthy container:**
   ```bash
   docker compose ps
   ```

2. **Run the test suite:**
   ```bash
   ./mvnw test
   ```
   *(Point out the `BUILD SUCCESS` and that Testcontainers booted PostgreSQL dynamically.)*

3. **Test the live endpoints:**
   ```bash
   curl -i http://localhost:8080/actuator/health
   curl -i http://localhost:8080/api/v1/ping
   ```
   *(Point out `status: UP` and the database component reporting `UP`.)*
