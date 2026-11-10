# Episode 6: Multi-Tier Distributed Caching (L1 Caffeine + L2 Redis)

- **Commit Scope:** `feat(cache)`
- **Commit Summary:** `feat(cache): implement L1 Caffeine + L2 Redis cache-aside architecture with negative caching`
- **Video Title Idea:** *Scaling Spring Boot Redirects with L1 Caffeine & L2 Redis Caching (Episode 6)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `README.md` or draw/show the 3-tier cache flow diagram (`L1 Caffeine -> L2 Redis -> PostgreSQL`).

**What to say:**
> *"Welcome back to ShortLink! In Phase 1, we benchmarked our system at 2,350 requests per second — but every single click hit PostgreSQL directly.*
>
> *Here is the problem: Our HikariCP database pool only has 10 connections. If a link goes viral and receives 50,000 clicks simultaneously, PostgreSQL will saturate and crash!*
>
> *Today in **Episode 6 (Phase 2 Kickoff)**, we solve this with a **Multi-Tier Cache-Aside Architecture**: **L1 Local Memory Caching with Caffeine** (under 0.1ms) backed by **L2 Distributed Caching with Redis 7** (under 1ms) — plus protection against cache stampedes and DDoS penetration attacks!"*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### 1. Docker Compose with Redis 7 (`docker-compose.yml`)
* **Show on screen:** Open `docker-compose.yml` showing the `redis` service.
* **Talking Points:**
  > *"First, we added `redis:7-alpine` to Docker Compose with `maxmemory 256mb` and an `allkeys-lru` eviction policy — so Redis never runs out of RAM and automatically evicts least-recently-used links.*
  >
  > *And notice our `app` container now requires both PostgreSQL AND Redis to pass their healthchecks before starting."*

### 2. Multi-Tier Cache-Aside Engine (`LinkCacheService.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/cache/LinkCacheService.java`.
* **Talking Points (Senior Engineering Highlights):**
  > *"Look at the read pipeline inside `getLink()`:*
  >
  > 1. ***L1 Check (Caffeine):*** *Checked first inside JVM heap memory. Takes nanoseconds with zero network hops.*
  > 2. ***L2 Check (Redis):*** *If L1 misses, we check Redis via `StringRedisTemplate`. If found, we populate L1 and return.*
  > 3. ***Stampede Protection (Striped Locking):*** *What if 1,000 threads miss L1 and L2 at the exact same millisecond for a cold viral link? We synchronize on a fixed 1,024-stripe lock array per `shortCode`, so **only 1 thread queries PostgreSQL** while the remaining 999 wait and immediately read the populated cache.*
  > 4. ***Cache Penetration Defense (Negative Caching):*** *If an attacker spams random codes like `/fake1`, `/fake2`, we cache a `NOT_FOUND` tombstone for 60 seconds so attackers cannot DDoS PostgreSQL.*
  > 5. ***Fail-Open Degradation:*** *Notice every Redis read/write is wrapped in a `try/catch`. If Redis ever restarts or drops temporarily, the app fails open and seamlessly falls back to PostgreSQL."*

### 3. Avoiding Connection Pool Leaks (`LinkService.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/service/LinkService.java`, pointing at `getDestinationUrl()`.
* **Senior Interview Flex:**
  > *"Look carefully at `getDestinationUrl()` — notice there is **NO `@Transactional` annotation** on this method!*
  >
  > *Why? If you put `@Transactional(readOnly = true)` on a method that checks Redis or Caffeine, Spring acquires a PostgreSQL connection from HikariCP **before** checking the cache! Removing `@Transactional` from the redirect path guarantees that L1 and L2 cache hits acquire **ZERO** database connections."*

---

## 3. Live Terminal & Integration Test Demo (2:00 – 3:15)

### Step 1: Run the Multi-Tier Cache Integration Test
```bash
./mvnw test -Dtest=LinkCacheServiceIntegrationTest
```
* **Highlight on screen:** Show both PostgreSQL and Redis containers booting in Testcontainers and `verify(linkRepository, times(1))` proving L1 hits, L2 hits, eviction, and negative caching!

### Step 2: Start Full Stack & Inspect Live Redis Keys
```bash
docker compose up -d
docker compose ps
```
Create a short link and redirect:
```bash
curl -X POST http://localhost:8080/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://github.com/samarth-kamble-7/shortlink", "customAlias": "redis-demo"}'
```
Inspect Redis directly inside the container:
```bash
docker exec -it shortlink-redis redis-cli KEYS "shortlink:*"
docker exec -it shortlink-redis redis-cli GET "shortlink:link:redis-demo"
```
**Say:** *"Look at that clean JSON payload sitting right inside Redis with a 24-hour TTL (`TTL shortlink:link:redis-demo`)!"*

---

## 4. Senior Interview Flex & Outro (3:15 – 3:45)

**Interview Question:** *"Explain the difference between Cache Penetration, Cache Stampede (Breakdown), and Cache Avalanche — and how do you solve all three?"*

**The Answer:**
> 1. ***Cache Penetration:*** *Querying keys that don't exist in cache or DB. **Solution:** Negative caching (caching `NOT_FOUND` sentinels with a short TTL).*
> 2. ***Cache Stampede (Breakdown):*** *A single hot key expires and thousands of threads hit the DB simultaneously. **Solution:** Per-key mutex / striped locking with double-checked locking.*
> 3. ***Cache Avalanche:*** *Millions of cached keys expire at the exact same second, overwhelming the DB. **Solution:** Add random TTL jitter ($\pm 5$ minutes) to every cached entry.*
>
> *We just implemented all three solutions in 150 lines of clean Java! In **Episode 7**, we will protect our API from abuse by building a **Distributed Rate Limiter** using Redis and Lua scripts! See you in Episode 7!"*

