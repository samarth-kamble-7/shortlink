# Episode 1: Project Skeleton & Core Infrastructure

- **Commit SHA:** `07322f8` (Initial commit `2a1c65c`)
- **Commit Summary:** `chore(init): setup project skeleton, docker-compose, and testcontainers smoke test`
- **Video Title Idea:** *Building a Production URL Shortener in Java 25: Architecture, Docker & Spring Boot (Episode 1)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `README.md` and display the **Architecture Diagram** (`docs/images/architecture.png`).

**What to say:**
> *"Welcome to building **ShortLink** from scratch! ShortLink is a production-grade, distributed URL shortening and real-time click-analytics platform designed to scale to tens of thousands of requests per second.*
>
> *Before writing any business logic, a senior engineer always sets up three things first: containerized infrastructure, production-grade configuration, and automated integration smoke tests.*
>
> *Today in Episode 1, we set up our foundational skeleton using **Java 25**, **Spring Boot 4**, **PostgreSQL 16 in Docker**, and **Testcontainers**. Let's dive right in!"*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### File 1: `docker-compose.yml`
* **Show on screen:** Open `docker-compose.yml`.
* **Talking Points:**
  > *"Instead of installing PostgreSQL directly on our host machine, we use Docker Compose with `postgres:16-alpine`.*
  >
  > *Notice our healthcheck: we run `pg_isready -U shortlink -d shortlink`. This guarantees the database is fully initialized and accepting sockets before our application ever attempts to run migrations."*

### File 2: `src/main/resources/application.yml`
* **Show on screen:** Open `src/main/resources/application.yml`.
* **Talking Points (Senior Engineering Decisions):**
  > *"In `application.yml`, notice three critical production settings:*
  >
  > 1. *`ddl-auto: validate`: We never allow Hibernate to auto-generate or modify tables with `update` or `create`. Flyway will be our single source of truth.*
  > 2. *`open-in-view: false`: Spring Boot defaults Open Session In View (OSIV) to true, which holds database connections open during HTTP JSON rendering. Turning it off releases the connection back to the HikariCP pool the moment our service transaction ends.*
  > 3. *`time_zone: UTC`: We explicitly enforce UTC across all JDBC timestamps to prevent timezone corruption across distributed servers."*

### File 3: `PingController.java` & `SecurityConfig.java`
* **Show on screen:** Open `src/main/java/com/shortlink/api/PingController.java`.
* **Talking Points:**
  > *"We created a lightweight liveness endpoint at `/api/v1/ping` that returns a structured timestamp and status. We configured Spring Security to permit requests to `/actuator/**` and `/api/v1/ping`."*

### File 4: `ShortlinkApplicationTests.java` (Testcontainers)
* **Show on screen:** Open `src/test/java/com/shortlink/ShortlinkApplicationTests.java`.
* **Talking Points:**
  > *"Notice how we test: we do NOT use an in-memory H2 database. H2 does not support PostgreSQL-specific indexes or concurrency behaviors. Instead, we use **Testcontainers** with `@ServiceConnection` to spin up a real, ephemeral PostgreSQL 16 Docker container during Maven test runs."*

---

## 3. Live Terminal Demonstration (2:00 – 3:00)

### Step 1: Start PostgreSQL via Docker Compose
Run:
```bash
docker compose up -d postgres
docker compose ps
```
**Say:** *"Our PostgreSQL container starts and transitions to healthy in seconds."*

### Step 2: Run Automated Tests
Run:
```bash
./mvnw test -Dtest=ShortlinkApplicationTests
```
**Say:** *"Testcontainers automatically communicates with Docker, boots PostgreSQL 16, runs our Spring Boot application context, and passes with zero errors."*

### Step 3: Run the Application & Verify Endpoints
Run:
```bash
./mvnw spring-boot:run
```
In a split terminal, verify:
```bash
curl -i http://localhost:8080/actuator/health
curl -i http://localhost:8080/api/v1/ping
```
**Say:** *"Both our Actuator health check and our ping endpoint return 200 OK!"*

---

## 4. Senior Interview Flex & Outro (3:00 – 3:30)

**Interview Question:** *"Why should you never use `auto-incrementing BIGSERIAL` IDs for public URLs in a high-scale distributed URL shortener?"*

**The Answer:**
> *"Two reasons: First, single-database auto-increment becomes a centralized write bottleneck and single point of failure. Second, sequential IDs make your URLs enumerable — a competitor or scraper can iterate through `id=1, 2, 3...` and scrape every link in your database.*
>
> *That brings us to **Episode 2**: next up, we will implement Twitter's 64-bit distributed **Snowflake ID generator** and our custom **Base62 encoder**! Hit subscribe, check out the code on GitHub, and see you in Episode 2!"*

