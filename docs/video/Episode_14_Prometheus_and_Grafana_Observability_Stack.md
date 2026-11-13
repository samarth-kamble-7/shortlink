# Episode 14: Prometheus & Grafana Observability Stack

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 4, Day 14  
**Focus**: Production telemetry, Micrometer Prometheus exposition, automated Grafana dashboard provisioning, and Golden Signal monitoring.

---

## 1. Episode Objective

In Episode 13, we scaled ShortLink horizontally across multiple PostgreSQL database shards using consistent hashing.

In this episode, we tackle **System Observability & Monitoring**:
1. Configure **Micrometer Prometheus Registry** (`/actuator/prometheus`) with sub-millisecond percentile histograms (P50, P95, P99) and SLA SLO bounds (2ms).
2. Deploy **Prometheus** to pull metrics from our high-throughput application every 5 seconds.
3. Automatically provision **Grafana** with zero manual configuration, pre-loading datasources and an executive system overview dashboard.
4. Monitor our distributed system in real time: Golden Signals, L1/L2 cache hit ratios, Redis Lua rate-limiter rejections, Kafka event streaming throughput & lag, and multi-shard database connection pools.

---

## 2. Architecture & Data Flow

```text
               ┌────────────────────────────────────────────────────────┐
               │              ShortLink Engine (:8080)                  │
               │  - Redirect Engine (P99 Latency Histograms)            │
               │  - L1 Caffeine / L2 Redis Cache Metrics                │
               │  - Redis Token Bucket Rate Limiter Counters            │
               │  - Kafka Click Producer & Batch Consumer Telemetry    │
               │  - Multi-Shard HikariCP Connection Pools               │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Scrape /actuator/prometheus (5s)
                                          ▼
                               ┌──────────────────────┐
                               │  Prometheus (:9090)  │
                               └──────────┬───────────┘
                                          │ PromQL Queries
                                          ▼
                               ┌──────────────────────┐
                               │   Grafana (:3000)    │
                               │ Auto-Provisioned UI  │
                               └──────────────────────┘
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to the ShortLink engineering masterclass! In the last episode, we partitioned our database across multiple shards with consistent hashing.

Now our system is running at high scale, but here is the critical engineering question:
*How do you know if your system is actually healthy in production before your users tell you it's down?*

Logging alone will destroy your disk at 10,000 requests per second. You need real-time, low-overhead metrics!

Today, in Episode 14, we are building a turnkey **Prometheus and Grafana Observability Stack** that automatically provisions itself in Docker with zero manual clicking."

---

### Segment 1: Micrometer Prometheus Exporter & Latency Histograms (1:15 - 3:15)
"Let's look at `application.yml` and `pom.xml`:

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  prometheus:
    metrics:
      export:
        enabled: true
  metrics:
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
      slo:
        http.server.requests: 2ms, 5ms, 10ms
```

Notice the `percentiles-histogram` and `slo: 2ms` configurations.
Why does this matter?
Averages lie in high-throughput systems! If 99 requests take 0.5 milliseconds, but 1 request takes 200 milliseconds, your average is under 3ms, but your 99th percentile user had a terrible experience.
Histograms allow Prometheus to compute mathematical percentiles across any arbitrary time window using `histogram_quantile(0.99, ...)`."

---

### Segment 2: Zero-Click Grafana Provisioning (3:15 - 5:00)
"Nobody in production should manually click around in Grafana to set up datasources and import dashboards. Everything must be declarative code:

1. `docker/grafana/provisioning/datasources/datasources.yml` points Grafana to `http://prometheus:9090`.
2. `docker/grafana/provisioning/dashboards/dashboards.yml` tells Grafana to automatically scan `/var/lib/grafana/dashboards`.
3. `shortlink_system_overview.json` contains our complete operations dashboard:
   - **Row 1: Golden Signals** — Total req/s, redirect rate, L1 cache hit ratio, and 5xx error rate.
   - **Row 2: Latency SLAs** — P50, P95, and P99 latency plotted right next to our 2ms SLA target line!
   - **Row 3: Caching & Rate Limiting** — Caffeine hits vs misses and Redis Lua 429 blocked requests.
   - **Row 4: Kafka Event Streaming** — Click event producer rate vs consumer ingestion rate and partition lag.
   - **Row 5: Multi-Shard Connection Pools** — Active vs idle connections on `shard-0` and `shard-1`."

---

### Segment 3: Live Terminal & Browser Verification (5:00 - 6:30)
"Let's spin up our full Docker Compose cluster:
```bash
docker compose up -d
```

Let's verify Prometheus is scraping our app:
Visit `http://localhost:9090/targets` — `app:8080` is healthy with state **UP**.

Now open Grafana at `http://localhost:3000` (credentials: `admin`/`admin`):
The **ShortLink Production Observability** dashboard loads instantly!

Let's generate some live traffic:
```bash
for i in $(seq 1 50); do
  curl -s http://localhost:8080/prom-test > /dev/null
done
```
Watch the meters jump:
- Throughput spikes to 50 req/s.
- P99 latency registers under 1.2 ms.
- L1 Cache Hit Ratio climbs to 98%.
- Kafka events stream smoothly into the batch consumer."

---

### Segment 4: Senior Interview Flex & Wrap-up (6:30 - 7:30)
"Here's a senior system design interview question:
*Why pull-based metrics (Prometheus) over push-based metrics (StatsD / Graphite)?*

With push-based metrics, if your application experiences a traffic spike of 100k req/s, the application can DDoS its own monitoring system by spamming metric UDP packets.
With Prometheus pull-based scraping, the scrape rate is completely constant and decoupled from traffic volume: whether your app is handling 1 request or 100,000 requests, Prometheus scrapes once every 5 seconds!

In Episode 15, we conduct our capstone finale: **Phase 4 Extreme Load Benchmarking with k6** to stress-test the entire distributed architecture at 10k+ req/s!

Make sure to star the repo on GitHub, and I'll see you in the next episode!"

