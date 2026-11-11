# Episode 8: Phase 2 Capstone — Extreme k6 Benchmarks, Java 25 Virtual Threads & Telemetry

- **Commit Scope:** `feat(perf)`
- **Commit Summary:** `feat(perf): enable Java 25 virtual threads, add cache/rate-limit telemetry, and execute extreme k6 stress test`
- **Video Title Idea:** *10,900+ req/s & 100% Cache Hit Rate with Java 25 Virtual Threads + k6 (Episode 8 - Phase 2 Finale)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `README.md` showing the **Phase 1 vs. Phase 2 Benchmarks** table.

**What to say:**
> *"Welcome back to Episode 8 — the grand finale of **Phase 2**!*
>
> *Over the last two episodes, we added L1 Caffeine local caching, L2 Redis distributed caching, and an atomic Redis Lua rate limiter.*
>
> *Today, we turn on **Java 25 Virtual Threads**, wire live **Micrometer observability metrics** to Actuator, and take the brakes off with an **extreme zero-pacing k6 stress test** ramping up to **200 simultaneous users**! Let's see what happens to our throughput and database load."*

---

## 2. Architecture & Code Walkthrough (0:30 – 1:45)

### 1. Java 25 Virtual Threads & Tomcat Tuning (`application.yml`)
* **Show on screen:** Open `src/main/resources/application.yml` around lines 4–6 and 40–43.
* **Talking Points:**
  > *"Look how simple yet powerful this configuration is in Spring Boot 4 + Java 25:*
  >
  > ```yaml
  > spring:
  >   threads:
  >     virtual:
  >       enabled: true
  > ```
  >
  > *Instead of tying up heavy OS platform threads for every incoming connection, Tomcat dispatches requests onto ultra-light **Java 25 Virtual Threads** — scaling effortlessly to thousands of concurrent requests."*

### 2. Live Cache & Rate-Limit Telemetry (`CacheConfig.java` & `RateLimiterService.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/config/CacheConfig.java` and `src/main/java/com/shortlink/ratelimit/RateLimiterService.java`.
* **Talking Points:**
  > *"In `CacheConfig.java`, we bind our Caffeine L1 cache directly to Micrometer via `CaffeineCacheMetrics.monitor()`. In `RateLimiterService.java`, we record every allowed, rejected, and fail-open decision to `shortlink.ratelimit.requests`.*
  >
  > *Now we don't have to guess whether our cache is working — we can prove it mathematically via `/actuator/metrics`!"*

### 3. Extreme Zero-Pacing Stress Test (`k6/extreme-cached-stress-test.js`)
* **Show on screen:** Open `k6/extreme-cached-stress-test.js`.
* **Talking Points:**
  > *"Notice two big changes from Episode 5:*
  > 1. *We removed `sleep()` completely — all 200 virtual users hammer the server nonstop!*
  > 2. *We rotate `X-Forwarded-For` across 500 simulated distributed client IPs, exercising **both** our Redis Lua rate limiter AND our L1 Caffeine cache simultaneously."*

---

## 3. Live Terminal & Extreme Benchmark Demo (1:45 – 3:15)

### Step 1: Run the 200-VU Extreme Stress Test
```bash
docker run --rm -i --network shortlink_default -e TARGET_URL=http://app:8080 grafana/k6:latest run - < k6/extreme-cached-stress-test.js
```

### Step 2: Highlight the 4 Big Numbers on Screen
When the test completes, hover over the terminal output:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Throughput:        http_reqs .........: 396815  10919.86/s          │
│ 2. Total Checks:      793629 / 793629 (100.00% Succeeded!)             │
│ 3. Min Latency:       min=204.5µs                                      │
│ 4. Error Rate:        http_req_failed ...: 0.00% (0 out of 396815)     │
└────────────────────────────────────────────────────────────────────────┘
```

**What to say:**
> *"Look at those numbers from a single Docker container running on a laptop:*
> - *Nearly **400,000 requests** handled in 35 seconds!*
> - *Sustained **10,920 requests per second** — almost **5x higher throughput** than Phase 1, even while executing a Redis Lua rate-limit script on every single request!*
> - *And **0.00% failure rate** — all 793,629 assertions passed!"*

### Step 3: Prove 100% Cache Hit Rate Live in Actuator
Run these two commands right after the test:
```bash
curl -s "http://localhost:8080/actuator/metrics/cache.gets?tag=cache:shortlink.l1.cache&tag=result:hit"
curl -s "http://localhost:8080/actuator/metrics/cache.gets?tag=cache:shortlink.l1.cache&tag=result:miss"
```
**What to say (The Mic Drop Moment):**
> *"Look at `/actuator/metrics`: `cache.gets` hits = **396,814+** ... and cache misses = **ZERO**!*
>
> *That proves **100.00% of our 396,000+ redirect requests were served directly from memory** without executing a single SQL query against PostgreSQL!"*

---

## 4. Phase 2 Recap & Phase 3 Teaser (3:15 – 3:45)

**What to say:**
> *"And with that, **Phase 2 of ShortLink is 100% complete**! We now have an ultra-fast, cache-accelerated, rate-limited URL shortener protected by Java 25 Virtual Threads and live Micrometer telemetry.*
>
> *Next up in **Phase 3 (Episodes 9–12)**, we transition into an **Event-Driven Architecture** with **Apache Kafka**:*
> - *We will emit asynchronous click events on every redirect without slowing down that sub-millisecond response!*
> - *And we will build Kafka consumer workers to process real-time GeoIP location, browser/device analytics, and time-series click dashboards.*
>
> *All source code and benchmarks are on GitHub in the description. Hit subscribe and I'll see you in Phase 3!"*

