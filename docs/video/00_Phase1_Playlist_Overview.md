
# ShortLink: Complete 15-Episode Masterclass Video Guide

Welcome to the complete production recording guide for **ShortLink: Building a Distributed URL Shortener & Real-Time Analytics Engine** across all 4 Phases (Days 1 to 15).

This directory contains the exact, word-for-word scripts, screen walkthroughs, senior engineering interview talking points, and terminal demonstration commands mapped directly to each project milestone.

---


## Series Structure & Complete 15-Episode Guide


### Phase 1: Core Foundation & Modular Monolith

| Episode                                                                | Title & Topic                              | Key Architecture / Files                                     |
| :--------------------------------------------------------------------- | :----------------------------------------- | :----------------------------------------------------------- |
| **[Episode 1](./Episode_01_Project_Skeleton_and_Docker_Postgres.md)**  | **Project Skeleton & Infrastructure**      | `docker-compose.yml`, Spring Boot 4, Java 25, PostgreSQL     |
| **[Episode 2](./Episode_02_Snowflake_ID_Generator_and_Base62.md)**     | **64-bit Snowflake ID Generator & Base62** | Bitwise math, 4096 IDs/ms/node, zero collisions              |
| **[Episode 3](./Episode_03_Flyway_Database_Migration_and_JPA.md)**     | **Flyway Schema Migrations & JPA**         | Partial indexes, soft deletes, Testcontainers                |
| **[Episode 4](./Episode_04_REST_APIs_Redirect_Engine_and_Postman.md)** | **Core REST APIs & Redirect Engine**       | HTTP 302 vs 301, SSRF DNS validation, RFC 7807               |
| **[Episode 5](./Episode_05_Production_Docker_and_k6_Benchmarks.md)**   | **Multi-Stage Dockerfile & Baseline k6**   | Eclipse Temurin 25 Alpine, non-root user, baseline load test |

---

### Phase 2: High-Performance Caching & Distributed Rate Limiting

| Episode                                                              | Title & Topic                               | Key Architecture / Files                                    |
| :------------------------------------------------------------------- | :------------------------------------------ | :---------------------------------------------------------- |
| **[Episode 6](./Episode_06_Redis_Caffeine_Caching.md)**              | **Two-Tier Cache (L1 Caffeine + L2 Redis)** | Near-cache eviction, null-object caching (anti-penetration) |
| **[Episode 7](./Episode_07_Distributed_Rate_Limiting_Redis_Lua.md)** | **Atomic Token Bucket Rate Limiting**       | Redis Lua script, sliding refills, `X-RateLimit-*` headers  |
| **[Episode 8](./Episode_08_Phase2_Extreme_k6_Benchmarks.md)**        | **Phase 2 Stress Testing & Saturation**     | Sub-millisecond P99 redirects, 429 Too Many Requests        |

---

### Phase 3: Event-Driven Click Streaming & Real-Time Analytics

| Episode                                                                   | Title & Topic                            | Key Architecture / Files                                   |
| :------------------------------------------------------------------------ | :--------------------------------------- | :--------------------------------------------------------- |
| **[Episode 9](./Episode_09_Apache_Kafka_Click_Streaming.md)**             | **Apache Kafka KRaft Click Streaming**   | Fire-and-forget async events, zero redirect latency impact |
| **[Episode 10](./Episode_10_Kafka_Batch_Consumer_and_Analytics_API.md)**  | **Kafka Batch Ingestion & Aggregation**  | 500-event batch consumer, idempotent click analytics       |
| **[Episode 11](./Episode_11_GeoIP_Enrichment_and_Location_Analytics.md)** | **MaxMind GeoLite2 Location Enrichment** | Fast IP lookup, country & city geolocation breakdown       |
| **[Episode 12](./Episode_12_Time_Series_Analytics_and_Click_Windows.md)** | **Time-Series Sliding Windows**          | 1h / 24h / 7d / 30d time-series buckets & analytics API    |

---

### Phase 4: Horizontal Scaling, Observability & Grand Finale

| Episode                                                                      | Title & Topic                              | Key Architecture / Files                                        |
| :--------------------------------------------------------------------------- | :----------------------------------------- | :-------------------------------------------------------------- |
| **[Episode 13](./Episode_13_Database_Sharding_and_Consistent_Hashing.md)**   | **Database Sharding & Consistent Hashing** | MurmurHash3 virtual node ring, multi-shard HikariCP             |
| **[Episode 14](./Episode_14_Prometheus_and_Grafana_Observability_Stack.md)** | **Telemetry, Prometheus & Grafana**        | Micrometer P95/P99 histograms, auto-provisioned dashboards      |
| **[Episode 15](./Episode_15_Phase4_Capstone_and_Extreme_Benchmarks.md)**     | **Capstone Benchmarks & Grand Finale**     | 200-VU stress test, end-to-end verification, architecture recap |

---

### Phase 5: High Availability, Load Balancing & Auth

| Episode                                                                                 | Title & Topic                                    | Key Architecture / Files                                                                               |
| :-------------------------------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **[Episode 16](./Episode_16_Nginx_Load_Balancer_and_Zero_Downtime_Failover.md)**        | **Nginx Load Balancer & Zero-Downtime Failover** | Nginx `least_conn`, `proxy_next_upstream` retry, multi-node Snowflake worker IDs, cluster Prometheus |
| **[Episode 17](./Episode_17_Distributed_Authentication_JWT_and_MultiTenancy.md)**       | **Stateless JWT Auth & Multi-Tenancy**           | Spring Security, Stateless JWT, Redis Refresh Token revocation, Snowflake User IDs, Private Dashboard |

---

### Phase 6: Client Frontend & Production UI

| Episode                                                                                 | Title & Topic                                    | Key Architecture / Files                                                                               |
| :-------------------------------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **[Episode 18](./Episode_18_NextJS_Frontend_Scaffolding_and_Design_System.md)**        | **Next.js Scaffolding & Anti-Slop Design System** | Clean Next.js 16 setup, untouched shadcn UI (`base-nova`), Anti-Slop Manifesto, Geist font pairing    |
| **[Episode 19](./Episode_19_Server_Actions_Secure_Auth_and_Custom_Hooks.md)**          | **Server Actions & Secure Cookie Auth**          | Next.js Server Actions, HTTP-only JWT cookies, TanStack Query `useAuth`, silent token refresh, shadcn |



---

## Recommended Video Setup & Tips for the Creator

1. **Resolution & Font Size:**
   - Screen resolution: 1080p (1920x1080) or 1440p (2560x1440).
   - IDE Font size: Set editor font to **16pt–18pt** so mobile viewers can read code clearly.
   - Terminal Font size: Set to **18pt–20pt** with a clean dark theme.

2. **Presentation Flow for Every Episode:**
   - **0:00 - 0:30 | The Hook:** State the problem we are solving and why it matters in high-scale distributed systems.
   - **0:30 - 2:00 | Architecture & Code Walkthrough:** Show the code in the IDE, highlighting senior design patterns.
   - **2:00 - 3:30 | Live Verification:** Run the tests, curl commands, or Docker commands in the terminal.
   - **3:30 - 4:00 | Senior Interview Flex & Outro:** Explain an interview-level question related to the topic and tease the next episode.
