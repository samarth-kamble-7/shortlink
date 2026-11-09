# Episode 5: Production Docker Packaging, Single-Command Compose & k6 Redirect Benchmarks

- **Commit Scope:** `feat(deploy)`
- **Commit Summary:** `feat(deploy): add multi-stage Dockerfile, docker-compose orchestration, k6 load test, and benchmark results`
- **Video Title Idea:** *Benchmarking Spring Boot Redirects with k6 & Docker at 2,300+ req/s (Episode 5 - Phase 1 Capstone)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `README.md` showing the architecture diagram and the **Benchmarks & Baseline Performance** section.

**What to say:**
> *"Welcome back to Episode 5 of ShortLink! Over the past four episodes, we built our Snowflake ID generator, our PostgreSQL schema with Flyway, and our core REST redirect APIs with SSRF protection.
>
> Today in Episode 5 — the grand finale of **Phase 1** — we package our application for production with a hardened, multi-stage **Dockerfile**, orchestrate the entire stack with **Docker Compose** so anyone can run it with a single command, and benchmark our raw redirect performance using **k6**! Let's examine our production container setup."*

---

## 2. Architecture & Code Walkthrough (0:30 – 1:45)

### 1. Multi-Stage Dockerfile & Security Hardening (`Dockerfile`)
* **Show on screen:** Open `Dockerfile`.
* **Key Talking Points:**
  > *"Notice our `Dockerfile` uses a **two-stage build**:
  >
  > - **Stage 1 (Builder):** Uses `eclipse-temurin:25-jdk` to compile our application and package the fat JAR. Notice how we copy Maven wrapper and `pom.xml` first: this enables Docker layer caching so re-building after code changes takes just seconds.
  > - **Stage 2 (Runtime):** Uses a lean `eclipse-temurin:25-jre` image. We do NOT ship build tools or the compiler to production.
  > - **Security Best Practice (Non-root User):** Never run containerized apps as root! We create an unprivileged system user `shortlink:shortlink` and switch to it before launching the app.
  > - **Generational ZGC:** We pass `-XX:+UseZGC -XX:+ZGenerational`. Generational ZGC reduces garbage collection pause times to under 1 millisecond, which is crucial for low-latency redirect engines."*

### 2. Single-Command Orchestration (`docker-compose.yml`)
* **Show on screen:** Open `docker-compose.yml`.
* **Key Talking Points:**
  > *"Notice our `app` service in `docker-compose.yml`:
  >
  > ```yaml
  > depends_on:
  >   postgres:
  >     condition: service_healthy
  > ```
  >
  > *By requiring `condition: service_healthy`, our app container waits until PostgreSQL has completed internal initialization and passes `pg_isready` before starting. This completely eliminates startup race conditions with Flyway migrations."*

### 3. Load Testing Methodology (`k6/baseline-redirect-test.js`)
* **Show on screen:** Open `k6/baseline-redirect-test.js`.
* **Key Talking Points:**
  > *"In our load test script, we simulate 50 concurrent virtual users over 25 seconds.
  >
  > In the `setup()` function, k6 creates a test link via `POST /api/v1/links`. In the default loop, 50 virtual users hammer `GET /{shortCode}`. We pass `redirects: 0` so k6 measures our server's direct `302 Found` response latency, rather than measuring external network latency."*

---

## 3. Live Terminal & Benchmark Demonstration (1:45 – 3:15)

### Step 1: Start the Entire Stack
Run:
```bash
docker compose up --build -d
docker compose ps
```
**Say:** *"With one single command, Docker Compose builds our hardened runtime image, boots PostgreSQL, applies Flyway migrations, and brings the entire platform up!"*

Check Actuator health:
```bash
curl -i http://localhost:8080/actuator/health
```
**Say:** *"Actuator reports status UP and confirms the PostgreSQL connection is active."*

### Step 2: Run the k6 Load Benchmark
Run:
```bash
docker run --rm -i --network shortlink_default -e TARGET_URL=http://app:8080 grafana/k6:latest run - < k6/baseline-redirect-test.js
```

### Step 3: Highlight the 4 Big Metrics on Screen
When the benchmark finishes, hover your mouse over the terminal output and highlight these 4 exact metrics:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Throughput:        http_reqs .........: 58998   2353.14/s           │
│ 2. p95 Latency:       p(95)=2.95ms                                     │
│ 3. Median Latency:    med=995µs  (Sub-millisecond!)                    │
│ 4. Error Rate:        http_req_failed ...: 0.00% (0 out of 58998)     │
└────────────────────────────────────────────────────────────────────────┘
```

**What to say (Word-for-Word):**
> 1. *"**Throughput:** In 25 seconds, our Spring Boot service processed **58,998 requests**, sustaining **2,353 requests every single second** across 50 concurrent users!"*
> 2. *"**p95 Latency:** Our target was p95 under 50ms, but look at the actual number: **2.95 milliseconds**! 95% of redirect requests finished in under 3 milliseconds."*
> 3. *"**Median Latency:** Our median latency was **995 microseconds** — that is sub-millisecond redirect resolution!"*
> 4. *"**Error Rate:** Out of 59,000 requests under heavy concurrency, we had **0.00% errors** — zero dropped connections, zero timeouts."*

---

## 4. Phase 1 Conclusion & Phase 2 Teaser (3:15 – 3:45)

**The Punchline:**
> *"And remember: this performance was achieved hitting **PostgreSQL directly with zero caching** on every single request!
>
> With this episode, **Phase 1 of ShortLink is 100% complete**! All 40 unit and integration tests are passing, and our modular monolith foundation is rock-solid.
>
> In **Phase 2**, we take this system to extreme distributed scale:
> - We will add **Redis distributed caching** and **Caffeine local in-memory caching** to push our throughput past **50,000 requests per second**!
> - And we will integrate **Apache Kafka** for async, real-time click stream analytics with partitioned consumer workers.
>
> All source code, Dockerfiles, and k6 benchmark scripts are available on GitHub in the description. Don't forget to like, subscribe, and hit the bell for Phase 2!"*

