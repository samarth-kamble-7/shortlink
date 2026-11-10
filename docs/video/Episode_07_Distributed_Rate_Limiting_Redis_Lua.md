# Episode 7: Distributed Rate Limiting & Abuse Prevention (Redis + Lua)

- **Commit Scope:** `feat(ratelimit)`
- **Commit Summary:** `feat(ratelimit): implement atomic Redis Lua Token Bucket rate limiter filter`
- **Video Title Idea:** *Building an Atomic Distributed Rate Limiter with Redis & Lua Scripts in Spring Boot (Episode 7)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `src/main/resources/scripts/rate_limiter.lua`.

**What to say:**
> *"Welcome back to Episode 7 of ShortLink! In Episode 6, we protected our read path with L1 Caffeine and L2 Redis caching.*
>
> *But what about our **write path**? Without rate limiting, a single bot can call `POST /api/v1/links` 100,000 times in a minute and fill our PostgreSQL database with spam!*
>
> *Today, we build an enterprise-grade, **Distributed Token Bucket Rate Limiter** powered by **Redis and Lua scripting** — guaranteeing 100% atomic enforcement across any number of servers!"*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### 1. Why a Lua Script inside Redis? (`rate_limiter.lua`)
* **Show on screen:** Open `src/main/resources/scripts/rate_limiter.lua`.
* **Talking Points:**
  > *"If you read a counter from Redis in Java, increment it, and write it back, concurrent requests will suffer from a **race condition**.*
  >
  > *Instead, we push the entire **Token Bucket algorithm** inside a **Lua script** executed directly inside Redis:*
  > 1. *Redis runs Lua scripts **atomically** in a single step — zero race conditions!*
  > 2. *It calculates elapsed time since the last request, refills tokens smoothly up to bucket capacity, and consumes 1 token.*
  > 3. *It automatically sets a `PEXPIRE` TTL so idle IP addresses don't leak Redis memory."*

### 2. Tiered Policies (`application.yml` & `RateLimitProperties.java`)
* **Show on screen:** Open `src/main/resources/application.yml` around `shortlink.rate-limit`.
* **Talking Points:**
  > *"Notice we configure **two separate rate-limit tiers**:*
  > - ***Write Tier (`POST` / `DELETE`):*** *Strict limit (capacity of 20 bursts, refilling at 0.5 tokens/sec = 30 writes/minute).*
  > - ***Read Tier (`GET` Redirects):*** *High burst tolerance (capacity of 1,000, refilling at 500/sec) so normal users and shared office NAT networks are never falsely blocked."*

### 3. Servlet Filter & Fail-Open Resilience (`RateLimitFilter.java` & `RateLimiterService.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/ratelimit/RateLimitFilter.java`.
* **Senior Engineering Highlights:**
  > *"Look at three critical details in our filter:*
  > 1. *Every response includes standard RFC headers: `X-RateLimit-Limit` and `X-RateLimit-Remaining`.*
  > 2. *When a client exceeds the limit, we return **`HTTP 429 Too Many Requests`** with a `Retry-After` header and a clean JSON error payload.*
  > 3. *Our `RateLimiterService` is **fail-open**: if Redis temporarily goes down, we log a warning and allow traffic through rather than taking down the whole platform."*

---

## 3. Live Terminal & Integration Test Demo (2:00 – 3:15)

### Step 1: Run the Token Bucket Integration Test
```bash
./mvnw test -Dtest=RateLimiterIntegrationTest
```
* **Highlight on screen:** Show the test consuming tokens `2 -> 1 -> 0`, triggering `429 Too Many Requests`, allowing a second IP (`203.0.113.42`), bypassing `/api/v1/ping`, and refilling tokens after waiting 1.1 seconds!

### Step 2: Live `curl` Demonstration Against Docker Compose
Rebuild and start the containers:
```bash
docker compose up --build -d
```
Send a loop of 22 requests to trigger live HTTP 429 throttling:
```bash
for i in {1..22}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/links \
    -H "Content-Type: application/json" \
    -d '{"longUrl": "https://github.com/samarth-kamble-7/shortlink"}')
  echo "Request $i -> HTTP $STATUS"
done
```
Show the headers on the 22nd request:
```bash
curl -i -X POST http://localhost:8080/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://github.com/samarth-kamble-7/shortlink"}'
```
**Say:** *"Look at the headers right there: `HTTP/1.1 429`, `X-RateLimit-Remaining: 0`, and `Retry-After: 2`!"*

---

## 4. Senior Interview Flex & Outro (3:15 – 3:45)

**Interview Question:** *"Why is the Token Bucket algorithm usually preferred over Fixed Window counters in API gateways?"*

**The Answer:**
> *"Fixed Window counters suffer from the **boundary burst problem**: if the limit is 100 requests/minute, an attacker can fire 100 requests at `00:59` and another 100 requests at `01:01`, hitting your server with 200 requests in 2 seconds.*
>
> *Token Bucket prevents boundary bursts by maintaining a continuous refill rate while still allowing legitimate short bursts up to the bucket capacity.*
>
> *In **Episode 8**, we wrap up Phase 2 with an **Extreme k6 Load Test**, removing artificial pauses to push our cached redirect engine toward maximum throughput! See you in Episode 8!"*

