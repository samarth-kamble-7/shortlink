# Episode 5: Production Docker Packaging, Single-Command Compose & k6 Redirect Benchmarks

This guide contains the exact video script, file walkthrough, and live demonstration steps for Episode 5 (the capstone episode of Phase 1).

---

## Git Commit Details

- **Type:** `feat`
- **Scope:** `deploy`
- **Commit Summary:** `feat(deploy): add multi-stage Dockerfile, docker-compose orchestration, k6 load test, and benchmark results`
- **Detailed Message:**
  ```text
  feat(deploy): add multi-stage Dockerfile, docker-compose orchestration, k6 load test, and benchmark results

  - Add hardened multi-stage Dockerfile (eclipse-temurin:25-jdk build -> eclipse-temurin:25-jre runtime)
  - Run container as unprivileged non-root user 'shortlink:shortlink'
  - Configure Generational ZGC (-XX:+UseZGC -XX:+ZGenerational) for low-latency GC pauses
  - Update docker-compose.yml to orchestrate Postgres and App with healthcheck dependencies
  - Add k6/baseline-redirect-test.js for automated 50-VU HTTP 302 redirect load testing
  - Update README.md with measured baseline benchmark throughput and p95 latency
  - Add docs/05_docker_packaging_and_k6_guide.md video guide
  ```

---

## Exact Video Script & Walkthrough

### Part 1: Intro & The Big Picture (20 Seconds)

> "Welcome back to ShortLink! Over the past four episodes, we built our Snowflake ID generator, our PostgreSQL schema with Flyway, and our core REST APIs with SSRF protection.
> 
> Today in Episode 5 — the final milestone of Phase 1 — we package our application for production with a hardened, multi-stage **Dockerfile**, orchestrate the entire stack with **Docker Compose** so anyone can run it in one command, and benchmark our raw redirect performance with **k6**!"

---

### Part 2: Architecture & Code Walkthrough (60 Seconds)

#### 1. Multi-Stage Build & Security Hardening (`Dockerfile`)
- **Show on screen:** Open `Dockerfile`.
- **Key Talking Points:**
  - **Stage 1 (Builder):** Uses `eclipse-temurin:25-jdk` to compile our application and package the fat JAR. We layer our Maven dependencies first so Docker can cache them between code changes.
  - **Stage 2 (Runtime):** Uses a lean `eclipse-temurin:25-jre` image. Notice we do NOT include the compiler or build tools in our production container.
  - **Security Best Practice (Non-root user):** "Never run Java apps as root in Docker. We create an unprivileged system user `shortlink:shortlink` and switch to it before launching the app."
  - **Low Latency JVM Flags:** "We enable **Generational ZGC** (`-XX:+UseZGC -XX:+ZGenerational`). This keeps GC pause times under 1 millisecond, which is crucial for a high-throughput redirect engine."

#### 2. Single-Command Orchestration (`docker-compose.yml`)
- **Show on screen:** Open `docker-compose.yml`.
- **Key Talking Points:**
  - **Healthcheck & Startup Ordering:** "Notice `depends_on: postgres: condition: service_healthy`. The app container will NOT start until PostgreSQL has actually completed its internal initialization and is answering queries. This eliminates Flyway migration startup race conditions."
  - **Single Command:** "Anyone who clones this repo can simply run `docker compose up -d --build`, and the whole system starts with zero extra configuration."

#### 3. Load Testing Methodology (`k6/baseline-redirect-test.js`)
- **Show on screen:** Open `k6/baseline-redirect-test.js`.
- **Key Talking Points:**
  - **Setup Phase:** k6 creates a test short link via our `POST /api/v1/links` API.
  - **Redirect Benchmark:** 50 virtual users hammer `GET /{shortCode}` concurrently.
  - **No External Request Overhead:** "We set `redirects: 0` so k6 measures the exact latency of our server returning the `302 Found` header, rather than timing GitHub's external servers."

---

### Part 3: Live Terminal Demonstration (60 Seconds)

#### 1. Build and Start the Entire Stack
```bash
docker compose up --build -d
```
Show both containers starting cleanly:
```bash
docker compose ps
```
Verify the health endpoint:
```bash
curl -i http://localhost:8080/actuator/health
```

#### 2. Run the k6 Load Benchmark
```bash
docker run --rm -i --network=host grafana/k6:latest run - < k6/baseline-redirect-test.js
```
Point to the terminal output:
- **Throughput:** ~1,000 to 2,000+ requests per second directly against PostgreSQL with zero caching.
- **Latency:** p95 latency under 20ms.
- **Error Rate:** 0.00% errors.

---

### Part 4: Phase 1 Recap & Phase 2 Teaser (20 Seconds)

> "And with that, **Phase 1 of ShortLink is 100% complete**! We have a robust, fully containerized, production-ready URL shortener.
> 
> In **Phase 2**, we are going to take this benchmark to the extreme. We'll introduce **Redis distributed caching** and **Caffeine in-memory L1 cache** to push our redirect throughput beyond 50,000 requests per second, followed by **Kafka** for async, real-time click analytics.
> 
> Don't forget to like, subscribe, and check out the repository linked below. See you in Phase 2!"

