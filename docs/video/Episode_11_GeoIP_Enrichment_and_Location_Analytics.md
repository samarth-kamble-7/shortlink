# Episode 11: GeoIP Location Enrichment & Country/City Analytics

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 3, Day 11  
**Focus**: Fast in-memory GeoIP resolution using MaxMind GeoLite2, private/loopback network protection, database migration, and Country/City analytics API.

---

## 1. Episode Objective

In Episode 10, we built a batch Kafka consumer that enriched click events with device and browser types and saved them idempotently to PostgreSQL.

In this episode, we add **Geographical Location Intelligence**:
1. Add `com.maxmind.geoip2:geoip2` for offline IP-to-location resolution.
2. Build `GeoIpService` with safety checks for loopback (`127.0.0.1`), private LANs (`192.168.x`, `10.x`), and IPv6 proxies.
3. Apply Flyway migration `V3__add_geoip_columns_to_click_events.sql` (`country`, `country_code`, `city`) with index `idx_click_events_short_code_country`.
4. Update `ClickEventConsumer` to enrich every click batch with country and city data before calling `ClickEventBatchRepository`.
5. Expand `GET /api/v1/links/{shortCode}/analytics` to provide `countryBreakdown` and `cityBreakdown`.

---

## 2. Architecture & Data Flow

```text
HTTP GET /{shortCode} (Client IP extracted from X-Forwarded-For)
       │
       ▼ (Async Virtual Thread)
Kafka Topic: shortlink.clicks
       │
       ▼ (Batch Poll: up to 100 events)
ClickEventConsumer
       │
       ├─► UserAgentParser ────► (deviceType, browser)
       ├─► GeoIpService ──────► (country, countryCode, city)
       │         │
       │         ├─► Loopback / Private LAN (127.0.0.1, 10.x, 192.168.x) ──► "Local Network"
       │         └─► Public IPv4/IPv6 ──► MaxMind GeoLite2 in-memory lookup (< 50µs)
       │
       ▼
ClickEventBatchRepository (INSERT INTO click_events ... ON CONFLICT (event_id) DO NOTHING)
       │
       ▼
PostgreSQL table: click_events
       ▲
       │
GET /api/v1/links/{shortCode}/analytics
       │
       ▼
AnalyticsService ──► LinkAnalyticsResponse (device, browser, referrer, country, city)
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to the ShortLink engineering series! In Episode 10, we set up our Kafka batch consumer and built the foundation for our click analytics engine.

Today, in Episode 11, we are answering the number one question marketers and creators ask:
*Where in the world are my clicks coming from?*

We're integrating offline GeoIP location enrichment:
- Resolving client IPs into Countries and Cities in microseconds.
- Handling private IP ranges and reverse proxies gracefully.
- Migrating our database schema without downtime.
- And giving our users a geographic breakdown in their analytics dashboard."

---

### Segment 1: Offline GeoIP Architecture & Private IP Safety (1:15 - 3:30)
"A rookie mistake in high-scale systems is calling an external HTTP API (like `ip-api.com` or `ipinfo.io`) for every click. That adds 50 to 200 milliseconds of latency, rate limits, and an external point of failure.

Instead, we use MaxMind's offline binary database reader (`GeoLite2-City.mmdb`) loaded into memory. Lookups take less than 50 microseconds.

Notice how `GeoIpService` handles internal traffic:
```java
if (inetAddress.isLoopbackAddress() || inetAddress.isSiteLocalAddress()) {
    return GeoLocation.LOCAL; // "Local Network"
}
```
If a request comes from `localhost` or an internal Docker bridge (`192.168.x`), we immediately tag it as `Local Network` without wasting cycles querying the database."

---

### Segment 2: Flyway Migration V3 & Batch Persistence (3:30 - 5:30)
"Let's look at `V3__add_geoip_columns_to_click_events.sql`.
We add `country`, `country_code`, and `city` to `click_events`. We also add a dedicated B-tree index on `(short_code, country)`.
Why? When users load their link dashboard, the query `GROUP BY country WHERE short_code = :shortCode` can run straight from the index without scanning the entire table.

In `ClickEventConsumer`, we pass the client IP to `geoIpService.resolve()` and write the enriched entity in our existing `JdbcTemplate` batch update."

---

### Segment 3: Geographic Analytics API (5:30 - 7:30)
"Let's inspect the updated `LinkAnalyticsResponse`:
- `countryBreakdown`: e.g. `{"United States": 450, "India": 230, "Germany": 90}`
- `cityBreakdown`: e.g. `{"San Francisco": 180, "Bengaluru": 110, "Berlin": 45}`

`AnalyticsService` queries `ClickEventRepository` using Spring Data JPA aggregation queries and returns the combined statistics."

---

### Segment 4: Verification in Docker Compose (7:30 - 9:30)
"Let's test this in production containers.
We run `docker compose up --build -d`.
We simulate clicks using curl with various `X-Forwarded-For` and `User-Agent` headers.
Then we call `GET /api/v1/links/{shortCode}/analytics` and verify that the country and city breakdowns match our simulated traffic."

---

### Outro (9:30 - 10:00)
"With GeoIP enrichment in place, ShortLink provides full end-to-end telemetry on every link click! In the upcoming episodes, we'll dive into database partitioning and sharding. Make sure to star the repo and subscribe for Episode 12!"

