# Episode 17: Distributed User Authentication, Stateless JWT & Multi-Tenancy

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 5, Day 17  
**Focus**: Why Auth belongs at the end of distributed systems engineering, Stateless JWT across Nginx load-balanced nodes, Redis-backed refresh token revocation, Snowflake user IDs, and private user dashboards.

---

## 1. Episode Objective

Up to Episode 16, we built a high-performance distributed engine capable of processing tens of thousands of requests per second:
- Sub-millisecond L1/L2 cached redirects
- Redis Lua distributed rate limiting
- Apache Kafka KRaft asynchronous click streaming & MaxMind GeoIP
- Consistent-hash PostgreSQL database sharding
- Nginx L7 load balancing with zero-downtime automatic failover

In this episode, we answer a foundational system design question:
**Why did we wait until Day 17 to build Authentication?**

We will break down the exact architectural principles behind building the core engine first and tenant isolation second. Then, we will implement production-grade **Stateless JWT Authentication**, **Redis Refresh Token Revocation**, and a **Private User Dashboard** in Spring Boot 4 and Java 25.

---

## 2. The Architectural Rationale: Why Auth Belongs Here

```text
Phase 1–4: The Distributed Engine (The "Racecar")
   - High-throughput redirects (<1ms)
   - L1/L2 Caching & Rate Limiting
   - Kafka Event Streaming & GeoIP
   - Database Sharding & Load Balancing
                       │
                       ▼
Phase 5: Governance & Security (The "Driver's Seat")
   - User Accounts & Roles
   - Private Dashboards ("My Links")
   - Team Workspaces & API Keys
```

### Pillar 1: The Core Product is 99% Anonymous
In a production URL shortener (like Bitly or Dub.co):
- **99% of all traffic is anonymous**: When an end-user clicks a short link on Twitter, WhatsApp, or an email (`shortlink.io/abc123`), they are **never** logged in. That redirect must happen in under 1 millisecond.
- If we had built Authentication on Day 1, we would have cluttered our core redirect path with user session filters, database lookups, and authentication interceptors, destroying our sub-millisecond redirect SLA from the very start.

### Pillar 2: We Avoided the "Session Trap"
This is the **#1 architectural mistake junior developers make**:
- If you build Auth on Day 1, you naturally reach for standard `HttpSession` (session cookies stored in the single application server's local RAM).
- Everything looks great until Day 16, when you add an **Nginx Load Balancer** and multiple application nodes (`app1` and `app2`).
- Suddenly, **your login completely breaks!** A user logs in on `app1`, their next click gets routed by Nginx to `app2`, and `app2` says: *"Who are you? Please log in again."*
- Because we already deployed our **Nginx Load Balancer** and **Redis Cluster**, we can build the **proper distributed Auth** right away:
  - **Stateless JWTs**: Any application node (`app1` or `app2`) can verify the token mathematically in sub-microseconds without querying the database or needing sticky sessions.
  - **Redis Token Revocation**: When a user logs out, their refresh token is deleted from Redis instantly across all cluster nodes.
  - **Snowflake User IDs**: Unified 64-bit ID generation across all entities.

### Pillar 3: Industry Precedent: Core Engine First, Tenant Isolation Second
If the car engine doesn't work, putting leather seats in it doesn't help!
You build a bulletproof, 10,000 req/s engine first. Now you are adding the keys, permissions, and private dashboard.

---

## 3. Architecture & Token Life Cycle

```text
 ┌───────────────────────┐                                     ┌───────────────────────┐
 │                       │  1. POST /api/v1/auth/register      │                       │
 │                       │     POST /api/v1/auth/login         │  Nginx Load Balancer  │
 │                       │ ──────────────────────────────────► │        (:8080)        │
 │                       │                                     └───────────┬───────────┘
 │                       │                                                 │
 │                       │                                 Round-robin     ▼
 │                       │                                     ┌───────────────────────┐
 │                       │                                     │  shortlink-app-1 / 2  │
 │                       │                                     │  - BCrypt verification│
 │                       │                                     │  - Mint JWT Access    │
 │                       │                                     │  - Mint Refresh Token │
 │                       │                                     └─────┬───────────┬─────┘
 │                       │                                           │           │
 │      Client / UI      │                                           │ Save      │ Save
 │   (Browser / Postman) │                                           ▼           ▼
 │                       │                                  ┌─────────────┐ ┌─────────┐
 │                       │                                  │ PostgreSQL  │ │  Redis  │
 │                       │                                  │ users table │ │ refresh │
 │                       │                                  └─────────────┘ └─────────┘
 │                       │  2. Returns:
 │                       │     { "accessToken": "...", "refreshToken": "..." }
 │                       │ ◄──────────────────────────────────────────────────────────
 │                       │
 │                       │  3. GET /api/v1/links/me
 │                       │     Authorization: Bearer <accessToken>
 │                       │ ──────────────────────────────────► [ Nginx ] ──► [ Spring Boot ]
 │                       │                                                     - Validate JWT
 │                       │                                                     - Query links
 │                       │  4. Returns User's Private Links                   where user_id = :id
 │                       │ ◄──────────────────────────────────────────────────────────
 └───────────────────────┘
```

---

## 4. Spoken Video Script

### Intro (0:00 - 2:00)
"Welcome back to the ShortLink engineering masterclass! In Episode 16, we placed an Nginx L7 Load Balancer in front of our Spring Boot application nodes with automatic failover.

Now, look at the comment section of almost every software engineering channel:
*Why didn't you build User Login and Authentication on Day 1?*
*Isn't Auth the very first thing you build in an application?*

Today, in Episode 17, I am going to explain why building Authentication at the beginning of a distributed systems project is actually a massive design trap, and why waiting until Day 17 is the hallmark of a Senior Staff Engineer.

Then, we will write the code: a production-grade **Stateless JWT and Redis-backed Authentication System** for our multi-node cluster."

---

### Segment 1: The 3 Architectural Pillars (2:00 - 5:30)
"Let's break down the 3 reasons why Auth belongs right here:

#### 1. The Core Product is 99% Anonymous
Think about how URL shorteners work in the real world:
When someone clicks a shortened link on Twitter, WhatsApp, or an SMS message, are they logged in?
No! **99% of our traffic is completely anonymous.**
Our primary business promise is that a redirect must resolve in under 1 millisecond.
If we had built user sessions on Day 1, we would have tangled our core redirect pipeline with session filters, database user lookups, and authorization interceptors. We would have degraded the core product before it was even finished!

#### 2. Avoiding the 'Session Trap'
This is the number one mistake junior developers make:
If you build Auth on Day 1, you naturally use standard `HttpSession` stored in the server's local RAM.
It works perfectly on localhost.
Then, you reach Episode 16: you deploy an **Nginx Load Balancer** with `app1` and `app2`.
Instantly, your authentication is broken! A user logs in on `app1`, their next request hits `app2`, and `app2` throws a 401 Unauthorized because its memory has no idea who they are.
Now you're forced to scramble: either enable sticky sessions (which destroys load balancing) or rewrite your entire security layer.
Because we already built our **Nginx Load Balancer** and our **Redis Cluster**, we build the *right* architecture from day one:
- **Stateless JWTs**: Validated in memory mathematically across any node in the cluster without database locks.
- **Redis Refresh Tokens**: Providing instant, cluster-wide revocation when a user clicks 'Log Out'.
- **64-bit Snowflake User IDs**: Maintaining uniform, non-colliding identity generation.

#### 3. Core Engine First, Tenant Isolation Second
Think of it like building a racecar:
Phase 1 through 4 was the engine, the chassis, the transmission, and the aerodynamics:
- 1ms redirects
- Two-tier Caffeine and Redis caching
- Kafka click streaming and GeoIP
- Database sharding and Nginx load balancing.
If the engine doesn't run at 10,000 RPM, putting leather seats and cup holders in it doesn't matter!
Now that the engine is screaming fast, we are installing the driver's seat and the keys."

---

### Segment 2: Database Schema & Flyway Migration (5:30 - 7:30)
"Let's look at `V4__create_users_table.sql`:

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_users_email UNIQUE (email)
);

ALTER TABLE links ADD COLUMN user_id BIGINT NULL;
ALTER TABLE links ADD CONSTRAINT fk_links_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_links_user_id ON links(user_id) WHERE user_id IS NOT NULL;
```

Notice two senior details:
1. `id` uses our 64-bit **Snowflake ID Generator**. No auto-increment database locks!
2. `links.user_id` is **nullable**. Anonymous users can still create and click links without an account! But when an authenticated user creates a link, it binds to their `user_id`."

---

### Segment 3: Stateless JWT & Redis Revocation (7:30 - 10:30)
"Let's examine `JwtService.java` and `RefreshTokenService.java`:
- When a user logs in via `POST /api/v1/auth/login`, Spring Security verifies their password using `BCryptPasswordEncoder` (strength 12).
- We mint a compact **JWT Access Token** signed with HMAC-SHA256 containing `userId`, `email`, and `role`, expiring in 15 minutes.
- We generate a secure random **Refresh Token** stored in Redis with a 7-day TTL:
  `SET auth:refresh:<token> <userId> EX 604800`
- When the user calls `POST /api/v1/auth/logout`, we delete that key from Redis. The user is logged out cluster-wide in 0.2 milliseconds!"

---

### Segment 4: Live Demonstration (10:30 - 13:30)
"Let's test the entire flow through our Nginx Load Balancer!

#### 1. Register a new user:
```bash
curl -i -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@shortlink.io","password":"SecurePassword123!","fullName":"Senior Engineer"}'
```
We get `201 Created` with our JWT access token and refresh token!

#### 2. Log in and capture the token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@shortlink.io","password":"SecurePassword123!"}' | jq -r .accessToken)
```

#### 3. Create an authenticated short link:
```bash
curl -i -X POST http://localhost:8080/api/v1/links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"longUrl":"https://github.com/spring-projects/spring-boot"}'
```

#### 4. Access the Private User Dashboard:
```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/links/me | jq .
```
Only links owned by this user are returned!

#### 5. Verify Redirect Latency Unaffected:
```bash
curl -i http://localhost:8080/{shortCode}
```
The public redirect returns `302 Found` in under 1ms, completely bypassing the auth filter!"

---

### Outro (13:30 - 15:00)
"And that is how you build production-ready, distributed authentication!

We didn't compromise our 1ms redirect SLA, we didn't fall into the session trap, and our authentication scales horizontally across all nodes behind our Nginx load balancer.

In the next episode, we will build a sleek Web UI dashboard with QR code generation so users can manage their links visually.

If this architectural breakdown helped you, hit the like button, subscribe, and star the GitHub repository!

See you in the next episode!"

---

## 5. Senior Engineering Interview Flex

1. **Why JWT over server-side sessions?**
   In a multi-node cluster behind a round-robin load balancer, server sessions require sticky sessions or cross-node replication. Stateless JWTs allow any server to verify requests mathematically with zero database or network overhead.
2. **How do you handle JWT revocation before expiry?**
   Keep access token lifetimes short (15 minutes) and store refresh tokens in Redis. For immediate access token blacklisting on critical security events (e.g. password change), store a `jwt_blacklist:<jti>` key in Redis with a TTL equal to the remaining access token lifetime.
3. **Why make `user_id` nullable on links?**
   Enables dual-mode operation: low-friction anonymous link creation to drive viral adoption, and authenticated ownership for advanced features like analytics, custom aliases, and link deletion.

