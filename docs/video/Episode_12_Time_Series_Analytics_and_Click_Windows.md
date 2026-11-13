# Episode 12: Time-Series Click Aggregations & Analytics Windows

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 3, Day 12  
**Focus**: Time-series bucketing using PostgreSQL `date_trunc`, sliding analytics windows (24h, 7d, 30d, all-time), continuous zero-filling, and dedicated time-series endpoints.

---

## 1. Episode Objective

In Episode 11, we integrated offline GeoIP location enrichment, giving creators geographical insights into their traffic.

In this episode, we build **Time-Series Click Intelligence**:
1. Leverage PostgreSQL's native `date_trunc('hour' | 'day', clicked_at)` function over our composite B-tree index `(short_code, clicked_at DESC)`.
2. Add sliding time windows (`24h`, `7d`, `30d`, and `all`) via enum `AnalyticsWindow`.
3. Implement continuous zero-filling in `AnalyticsService` so chart frontends receive unbroken timeline series without missing buckets.
4. Expose `window` parameter on `GET /api/v1/links/{shortCode}/analytics` and provide a dedicated `GET /api/v1/links/{shortCode}/analytics/timeseries` endpoint for lightweight chart polling.

---

## 2. Architecture & Data Flow

```text
HTTP GET /api/v1/links/{shortCode}/analytics?window=24h
HTTP GET /api/v1/links/{shortCode}/analytics/timeseries?window=24h
       │
       ▼
 AnalyticsController
       │
       ▼
 AnalyticsService
       │
       ├─► Resolves AnalyticsWindow (e.g. 24h -> Instant.now() - 24 hours)
       ├─► Queries ClickEventRepository (filtered window queries & date_trunc bucketing)
       │         │
       │         └─► Uses index: (short_code, clicked_at DESC)
       ├─► Zero-Fills missing timestamp intervals (hourly or daily)
       │
       ▼
 LinkAnalyticsResponse (with timeSeries: [{timestamp, clicks}, ...])
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to the ShortLink engineering series! In Episode 11, we added geographic location intelligence to our analytics engine.

Today, in Episode 12, we solve one of the most critical requirements for any production analytics dashboard:
*Trend analysis over time.*

Instead of just showing static lifetime totals, we'll build:
- High-performance hourly and daily click bucketing.
- Sliding time windows like the last 24 hours, 7 days, and 30 days.
- Zero-filled continuous timeline generation for smooth chart rendering.
- And dedicated time-series API endpoints."

---

### Segment 1: High-Performance Date Trunc Aggregations (1:15 - 3:30)
"A common design flaw when computing time-series in application code is fetching thousands of raw rows and grouping them in Java. That wastes network bandwidth and memory.

Instead, we push the grouping directly to PostgreSQL using `date_trunc`:
```sql
SELECT date_trunc('hour', clicked_at) AS bucket, COUNT(*) AS count
FROM click_events
WHERE short_code = :shortCode AND clicked_at >= :since
GROUP BY bucket
ORDER BY bucket ASC
```
Because we already created a composite index on `(short_code, clicked_at DESC)` in Day 10, PostgreSQL executes an efficient index range scan, instantly grouping thousands of clicks in milliseconds."

---

### Segment 2: Continuous Time-Series & Zero-Filling (3:30 - 5:30)
"Databases only return rows for timestamps that have data. If your link received clicks at 10 AM and 1 PM, SQL returns only those two rows.
If you send that raw data to a frontend chart library like Chart.js or Recharts, the graph will jump or break.

In `AnalyticsService`, we implemented `zeroFill()`:
```java
Instant cursor = since.truncatedTo(unit);
while (!cursor.isAfter(end)) {
    long count = countsByBucket.getOrDefault(cursor, 0L);
    continuous.add(new TimeSeriesPoint(cursor, count));
    cursor = cursor.plus(1, unit);
}
```
This guarantees an unbroken sequence of timestamp buckets, with `0` for inactive periods."

---

### Segment 3: Sliding Windows & REST Endpoints (5:30 - 7:30)
"Let's check the API:
- `GET /api/v1/links/{shortCode}/analytics?window=24h`: returns total clicks, unique visitors, devices, browsers, referrers, and countries strictly within the last 24 hours, plus 24 hourly data points.
- `GET /api/v1/links/{shortCode}/analytics/timeseries?window=24h`: returns only the lightweight time-series array, perfect for periodic chart refreshes without re-fetching all metadata."

---

### Segment 4: Verification & Live Docker Testing (7:30 - 9:30)
"Let's see it live!
We run our automated test suite across all 75+ tests.
Then we deploy with `docker compose up --build -d`, simulate clicks across multiple hours, and curl the analytics API with different `?window=` parameters."

---

### Outro (9:30 - 10:00)
"Our analytics engine now supports full multi-dimensional time-series trend analysis! Make sure to like, subscribe, and star the repository on GitHub!"

