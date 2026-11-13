# Episode 10: Kafka Batch Consumer, Click Event Persistence & Analytics API

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 3, Day 10  
**Focus**: Consuming Kafka click events in batches, User-Agent enrichment, idempotent PostgreSQL persistence, and Link Analytics REST API.

---

## 1. Episode Objective

In Episode 9, we built our non-blocking `ClickEventProducer` on top of Java 25 Virtual Threads to stream click telemetry to Kafka without slowing down HTTP 302 redirects.

In this episode, we complete the pipeline by:
1. Creating a Flyway migration (`V2__create_click_events_table.sql`) with a composite index on `(short_code, clicked_at DESC)`.
2. Building `UserAgentParser` to categorize visitors by device type (`MOBILE`, `DESKTOP`, `TABLET`, `BOT`) and browser (`Chrome`, `Safari`, `Firefox`, `Edge`, etc.).
3. Implementing `ClickEventConsumer` with batch listener mode (`type: batch`, `max-poll-records: 100`).
4. Using `JdbcTemplate` with PostgreSQL `ON CONFLICT (event_id) DO NOTHING` for idempotent batch persistence.
5. Exposing `GET /api/v1/links/{shortCode}/analytics` with aggregated statistics.

---

## 2. Architecture & Data Flow

```text
HTTP GET /{shortCode}
       │
       ▼ (Async Virtual Thread)
Kafka Topic: shortlink.clicks (key: shortCode)
       │
       ▼ (Batch Poll: up to 100 events)
ClickEventConsumer
       │
       ├─► UserAgentParser (Enrich: deviceType, browser)
       │
       ▼
ClickEventBatchRepository (INSERT ... ON CONFLICT (event_id) DO NOTHING)
       │
       ▼
PostgreSQL table: click_events
       ▲
       │
GET /api/v1/links/{shortCode}/analytics
       │
       ▼
AnalyticsService ──► LinkAnalyticsResponse
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to the ShortLink engineering series! In Episode 9, we achieved ultra-fast, sub-millisecond HTTP 302 redirects by streaming click events to Apache Kafka asynchronously on Java 25 Virtual Threads.

Today, in Episode 10, we build the other side of that streaming pipeline:
- A high-throughput batch consumer that polls Kafka.
- An in-memory User-Agent parser that enriches click telemetry with device and browser types.
- Idempotent PostgreSQL persistence using `ON CONFLICT DO NOTHING` so network retries never corrupt click counts.
- And a brand-new Analytics API that gives users real-time insights into who is clicking their links."

---

### Segment 1: The Click Events Schema (1:15 - 3:00)
"Let's check `V2__create_click_events_table.sql`.
Notice the primary key is `event_id` (a UUID generated at the moment the click happens).
Why? Because distributed messaging systems guarantee *at-least-once* delivery. If a consumer rebalances or fails before acknowledging, Kafka redelivers the batch. Having `event_id` as the primary key allows us to do idempotent inserts.

We also add an index on `(short_code, clicked_at DESC)` so aggregations and recent-click queries execute directly from index scans without full table scans."

---

### Segment 2: Batch Processing & User-Agent Enrichment (3:00 - 5:30)
"Instead of inserting rows one-by-one, we configure Spring Kafka in batch mode:
`spring.kafka.listener.type: batch` and `max-poll-records: 100`.

In `ClickEventConsumer`, we receive a list of message payloads. For each event:
1. Deserialization via Jackson.
2. Device & browser extraction with our zero-dependency `UserAgentParser`.
3. Batch persistence with `ClickEventBatchRepository.saveAllIdempotent()`.

If any single JSON record is malformed, we log it and increment Micrometer counter `shortlink.analytics.consumed` with tag `outcome=malformed`, ensuring a bad payload never crashes the listener."

---

### Segment 3: The Analytics REST API (5:30 - 7:30)
"Next, we expose `GET /api/v1/links/{shortCode}/analytics`.
`AnalyticsService` queries `ClickEventRepository` using Spring Data JPA aggregations to compute:
- Total clicks
- Unique visitors (distinct client IPs)
- Last clicked timestamp
- Device breakdown (e.g. 70% Mobile, 30% Desktop)
- Browser breakdown (e.g. Chrome, Safari)
- Top referrers (e.g. Google, Twitter, Direct)"

---

### Segment 4: Live Verification & Testing (7:30 - 9:30)
"Let's see it in action!
We wrote `ClickAnalyticsIntegrationTest` using Testcontainers (`PostgreSQL`, `Redis`, and native `Kafka`).
We trigger short link redirects, await consumer processing via Awaitility, and query the analytics endpoint.
Then, we deploy to Docker Compose and query live stats through curl."

---

### Outro (9:30 - 10:00)
"Our distributed analytics pipeline is now complete! In Episode 11, we will explore database sharding strategies to scale out our PostgreSQL storage across multiple shards. Don't forget to like, subscribe, and star the repository!"

