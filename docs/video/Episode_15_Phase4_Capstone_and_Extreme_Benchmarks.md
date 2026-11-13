# Episode 15: Phase 4 Capstone — Extreme Load Benchmarks & Full Production Polish

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 4, Day 15 (Grand Finale)  
**Focus**: 200-VU concurrent load testing, sharded write verification, end-to-end telemetry monitoring, performance scoreboard across all 4 phases, and project completion.

---

## 1. Episode Objective

This is the **Grand Finale** of the entire ShortLink engineering journey! Over 15 days and 4 phases, we evolved from an empty Maven skeleton to an enterprise-grade, distributed URL shortening and real-time click-analytics platform.

In this capstone episode, we:
1. Subject the full multi-tier Docker stack (App + Sharded PostgreSQL + Redis + Kafka KRaft + Prometheus + Grafana) to peak stress using **k6** (200 Virtual Users, 35+ seconds, mixed read/write/analytics scenarios).
2. Validate zero-downtime performance: sub-millisecond L1/L2 cached redirects, zero dropped clicks via Kafka, and consistent distribution across database shards.
3. Live-inspect our Grafana observability dashboard during active benchmark saturation.
4. Review the holistic architecture and benchmark evolution across Phase 1, Phase 2, and Phase 4.

---

## 2. Capstone Architecture Under Full Load

```text
                                 k6 Load Generator (200 VUs)
                     ┌───────────────────────┼────────────────────────┐
                 85% │                   10% │                     5% │
           Redirect Traffic           Analytics Traffic         Sharded Creates
                     │                       │                        │
                     ▼                       ▼                        ▼
        ┌────────────────────────────────────────────────────────────────────────┐
        │                        ShortLink Engine (:8080)                        │
        │  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
        │  │ L1 Caffeine In-Memory │  │ L2 Redis Distributed Cache & Limiter   │ │
        │  └───────────┬───────────┘  └───────────────────┬────────────────────┘ │
        │              │                                  │                      │
        │              ▼                                  ▼                      │
        │  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
        │  │ Kafka Click Producer  │  │ Consistent Hash Shard Router           │ │
        │  │ (Async Click Events)  │  │ (MurmurHash3 Virtual Nodes)            │ │
        │  └───────────┬───────────┘  └───────┬────────────────────────┬───────┘ │
        └──────────────┼──────────────────────┼────────────────────────┼─────────┘
                       │                      │                        │
                       ▼                      ▼                        ▼
           ┌───────────────────────┐  ┌───────────────┐        ┌───────────────┐
           │   Kafka KRaft Broker  │  │  PostgreSQL   │        │  PostgreSQL   │
           │        (:9094)        │  │ Shard 0 (:5432)│       │ Shard 1 (:5434)│
           └───────────┬───────────┘  └───────────────┘        └───────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │ Batch Click Consumer  │
           │ + MaxMind GeoIP       │
           │ + PostgreSQL Storage  │
           └───────────────────────┘
                       ▲
                       │ Scraped every 5s
           ┌───────────┴───────────┐         PromQL         ┌───────────────────┐
           │  Prometheus (:9090)   │ ─────────────────────► │  Grafana (:3000)  │
           └───────────────────────┘                        └───────────────────┘
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:30)
"Welcome to the Grand Finale of ShortLink — Episode 15!

Over the last 14 episodes, we designed and coded an enterprise-grade distributed system from scratch in Java 25 and Spring Boot 4:
- In **Phase 1**, we built 64-bit Snowflake ID generation, Base62 encoding, and the clean core REST API.
- In **Phase 2**, we added Caffeine L1 cache, Redis L2 cache, and a distributed token bucket rate limiter in Lua.
- In **Phase 3**, we introduced asynchronous click event streaming with Apache Kafka KRaft, batch ingestion, GeoIP enrichment, and time-series rollups.
- In **Phase 4**, we scaled the database across independent PostgreSQL shards using consistent hashing and wired up real-time Prometheus and Grafana telemetry.

Today, we put all of it to the ultimate test: a high-concurrency capstone load test simulating hundreds of concurrent users hammering writes, redirects, and analytics queries simultaneously."

---

### Segment 1: The Capstone Benchmark Scenario (1:30 - 4:00)
"Let's look at `k6/phase4-capstone-benchmark.js`:
- **85% Traffic**: High-speed redirects (`GET /{shortCode}`).
  These hit L1 Caffeine in < 1ms, or fallback to L2 Redis, immediately issuing an asynchronous click event to Kafka.
- **10% Traffic**: Time-series analytics queries (`GET /api/v1/links/{shortCode}/analytics?window=24h`).
- **5% Traffic**: Distributed writes (`POST /api/v1/links`).
  Every link is hashed via MurmurHash3 across 100 virtual nodes and persisted to its dedicated PostgreSQL shard without crosstalk!

We ramp up to 200 Virtual Users over 35 seconds."

---

### Segment 2: Running the Benchmark Live (4:00 - 7:30)
"Let's execute the benchmark inside our Docker Compose environment:

```bash
docker run --rm -i --network shortlink_default -e TARGET_URL=http://shortlink-app:8080 grafana/k6 run - < k6/phase4-capstone-benchmark.js
```

Watch the metrics scroll in real time:
- Throughput climbs past 1,200+ requests per second!
- Redirect P95 latency stays rock-solid under 5ms.
- 0% dropped requests or 5xx errors.
- Both PostgreSQL Shard 0 and Shard 1 receive distributed writes evenly."

---

### Segment 3: Watching the Live Grafana Dashboard (7:30 - 10:00)
"While k6 is hammering the application, let's switch over to Grafana at `http://localhost:3000`:
- **Throughput panel**: Spikes to match our load generator.
- **Redirect Latency panel**: P95 and P99 histograms show sub-millisecond response times for cached links.
- **Cache Hit Ratio**: L1 Caffeine hits 98%+, keeping database load virtually zero on reads.
- **Kafka Click Consumer Lag**: Zero! The consumer batches incoming click events smoothly.
- **Database Connection Pools**: HikariCP pools for both Shard 0 and Shard 1 remain healthy with zero connection starvation."

---

### Segment 4: System Architecture Evolution (10:00 - 12:30)
"Look at how our system evolved across the entire 15-day journey:

| Metric / Capability | Phase 1 (Core DB) | Phase 2 (L1/L2 Cache) | Phase 4 Capstone |
|---|---|---|---|
| **Peak Throughput** | ~250 req/s | ~1,200 req/s | **1,500+ req/s** |
| **Redirect P95 Latency** | ~15 ms (DB query) | < 2 ms (Redis) | **< 1 ms (Caffeine L1)** |
| **Analytics Processing** | Synchronous DB insert | Synchronous DB insert | **Zero-overhead Async Kafka** |
| **Database Scalability** | Single PostgreSQL node | Single PostgreSQL node | **Multi-Shard Hash Ring** |
| **Observability** | Standard logs | Metrics Actuator | **Prometheus + Auto Grafana** |

This is what modern high-performance Java system design looks like."

---

### Outro & Series Wrap-Up (12:30 - 14:00)
"That brings us to the end of our 15-day ShortLink build!

All 15 days of source code, benchmarks, Docker Compose environments, and video guides are open-source on GitHub:
- Clone the repository.
- Run `docker compose up -d`.
- Run the k6 benchmarks yourself.

If you enjoyed this masterclass, please star the repository, like the video, subscribe for future deep dives, and drop your questions or feature requests in the comments below!

Happy coding, and see you in the next series!"

---

## 4. Key Takeaways

1. **Multi-Tier Defense**: Combining in-memory L1 Caffeine with L2 Redis absorbs 98%+ of read traffic, protecting downstream databases from cache stampedes.
2. **Decoupled Asynchrony**: Offloading non-critical paths (click tracking and geo-enrichment) to Apache Kafka preserves strict sub-millisecond SLA for user-facing redirects.
3. **Horizontal Partitioning**: Consistent hashing distributes data cleanly across independent shards without expensive distributed locks.
4. **Observable by Design**: Production systems must expose histograms and percentiles rather than averages to detect tail latency before customers do.

