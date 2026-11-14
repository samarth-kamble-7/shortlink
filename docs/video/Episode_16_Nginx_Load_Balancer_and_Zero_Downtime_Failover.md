# Episode 16: Nginx L7 Load Balancer & Zero-Downtime Automatic Failover

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Bonus / Day 16  
**Focus**: L7 reverse proxying, `least_conn` load distribution, transparent retry failover (`proxy_next_upstream`), multi-node Snowflake worker isolation, and cluster telemetry.

---

## 1. Episode Objective

In Episode 15, we completed our 15-day capstone load test and proved that ShortLink can handle extreme throughput with multi-shard PostgreSQL, Redis caching, and Kafka click streaming.

However, in real production deployments, running a **single application container** is an operational anti-pattern:
1. **Single Point of Failure (SPOF)**: If that single Java process crashes, GC-stalls, or restarts during a deployment, 100% of your service goes dark.
2. **CPU Saturation**: A single container cannot exceed the core limits of one VM.

In this episode, we scale ShortLink horizontally by introducing an **Nginx L7 Reverse Proxy & Load Balancer**:
- Distribute incoming traffic across multiple Spring Boot nodes (`app1` and `app2`) using `least_conn`.
- Configure **Transparent Automatic Failover** (`proxy_next_upstream`): if one server crashes, Nginx retries the surviving node in milliseconds—the end-user sees zero errors!
- Partition Twitter Snowflake worker IDs (`SHORTLINK_NODE_ID: 1` and `SHORTLINK_NODE_ID: 2`) to ensure 100% collision-free distributed 64-bit ID generation.
- Aggregate cluster-wide metrics in Prometheus and Grafana.

---

## 2. Architecture & High Availability Failover

```text
                                           User Traffic / k6 Load
                                                      │
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │     Nginx Load Balancer     │ (Port :8080 / :80)
                                       │   - least_conn distribution │
                                       │   - HTTP/1.1 keepalive (64) │
                                       │   - Automatic failover retry│
                                       │   - X-Forwarded-For headers │
                                       └──────────────┬──────────────┘
                                                      │
                            ┌─────────────────────────┴─────────────────────────┐
                            │                                                   │
                            ▼                                                   ▼
             ┌─────────────────────────────┐                     ┌─────────────────────────────┐
             │       shortlink-app-1       │                     │       shortlink-app-2       │
             │   - Spring Boot 4/Java 25   │                     │   - Spring Boot 4/Java 25   │
             │   - SHORTLINK_NODE_ID: 1    │                     │   - SHORTLINK_NODE_ID: 2    │
             │   - L1 Caffeine Cache       │                     │   - L1 Caffeine Cache       │
             └──────────────┬──────────────┘                     └──────────────┬──────────────┘
                            │                                                   │
                            └─────────────────────────┬─────────────────────────┘
                                                      │
                 ┌────────────────────────────────────┼────────────────────────────────────┐
                 ▼                                    ▼                                    ▼
       ┌────────────────────┐               ┌────────────────────┐               ┌────────────────────┐
       │   Redis 7 (:6379)  │               │ Kafka KRaft (:9094)│               │ Multi-Shard Postgres│
       │ L2 Cache & Limiter │               │ Async Click Events │               │ Shard 0 & Shard 1  │
       └────────────────────┘               └────────────────────┘               └────────────────────┘
                 ▲                                                                         ▲
                 │ Scrape app1:8080 + app2:8080                                            │
       ┌─────────┴──────────┐                          PromQL                    ┌─────────┴──────────┐
       │ Prometheus (:9090) │ ─────────────────────────────────────────────────► │   Grafana (:3000)  │
       └────────────────────┘                                                    └────────────────────┘
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to ShortLink! In the last episode, we hit our grand finale capstone benchmark.

But here is a fundamental system design question you will be asked in every senior engineering interview:
*What happens when your application server crashes, or when you need to deploy a new version in the middle of the day without dropping a single user request?*

If you only have one application instance running behind your domain, your uptime SLA is immediately destroyed!

Today, in Episode 16, we take ShortLink to enterprise-grade high availability: we are placing an **Nginx L7 Load Balancer** in front of a multi-node Spring Boot application cluster with **automatic zero-downtime failover**."

---

### Segment 1: The Upstream Configuration & Transparent Failover (1:15 - 3:45)
"Let's look at `docker/nginx/nginx.conf`:

```nginx
upstream shortlink_backend {
    least_conn;
    server app1:8080 max_fails=2 fail_timeout=5s;
    server app2:8080 max_fails=2 fail_timeout=5s;
    keepalive 64;
}
```

Notice three critical production configurations:
1. **`least_conn`**: Rather than blind round-robin, Nginx sends new requests to the container currently handling the fewest active connections.
2. **`keepalive 64`**: Reuses TCP connections between Nginx and the backend JVMs, eliminating costly TCP three-way handshakes under heavy load.
3. **`proxy_next_upstream`**:
   ```nginx
   proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
   proxy_next_upstream_tries 2;
   proxy_next_upstream_timeout 2s;
   ```
   If `app1` crashes mid-request or returns an error, Nginx **does not fail the client**. It transparently retries `app2` within milliseconds! The user never sees a 502 Bad Gateway!"

---

### Segment 2: Preserving Rate Limiting & GeoIP (3:45 - 5:15)
"When you place a reverse proxy in front of your app, what is the remote IP address that Spring Boot sees?
By default, it sees Nginx's internal IP (`172.18.0.x`)!

If you don't fix this, your **Redis Token Bucket Rate Limiter** will throttle all users together as one person, and your **MaxMind GeoIP** will flag every user as a local private network!

To fix this, Nginx forwards the real client IP:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
Now our rate limiter and geolocation engine continue to work with 100% precision."

---

### Segment 3: Multi-Node Snowflake Worker ID Isolation (5:15 - 6:45)
"Now look at `docker-compose.yml`. We split our backend into two nodes:
- `shortlink-app-1`: `SHORTLINK_NODE_ID: 1`
- `shortlink-app-2`: `SHORTLINK_NODE_ID: 2`

Why is this essential?
In our Twitter Snowflake ID generator from Episode 2, each 64-bit ID embeds a 10-bit worker node ID.
If both nodes generated IDs with node ID 1, two requests arriving in the exact same millisecond on different nodes could produce duplicate IDs!
By isolating node IDs at the infrastructure level, our distributed generator guarantees **zero collisions cluster-wide** without distributed locking!"

---

### Segment 4: Live Demonstration — Load Balancing & Killing a Server (6:45 - 9:30)
"Let's test this live in our terminal!

First, let's fire 6 ping requests through Nginx:
```bash
for i in {1..6}; do curl -i -s http://localhost:8080/api/v1/ping | grep "X-Upstream-Server"; done
```
Look at the output:
```text
X-Upstream-Server: 172.18.0.7:8080   # Node 2
X-Upstream-Server: 172.18.0.6:8080   # Node 1
X-Upstream-Server: 172.18.0.7:8080   # Node 2
X-Upstream-Server: 172.18.0.6:8080   # Node 1
```
Traffic is evenly distributed across both JVM instances.

Now for the ultimate test: **Killing a server under traffic!**
```bash
docker stop shortlink-app-1
curl -i http://localhost:8080/api/v1/ping
```
Look at that: `HTTP/1.1 200 OK`!
Nginx instantly caught the refusal from Node 1, redirected the request to Node 2, and returned 200 OK. Zero dropped requests, zero downtime!

And when we bring Node 1 back online:
```bash
docker start shortlink-app-1
```
Nginx automatically resumes sharing traffic to it as soon as its health check passes."

---

### Segment 5: Cluster Telemetry in Prometheus (9:30 - 11:00)
"Finally, what about our metrics?
In `docker/prometheus/prometheus.yml`, we updated our scrape configuration:
```yaml
static_configs:
  - targets: ["app1:8080", "app2:8080"]
```
Now Prometheus scrapes telemetry from both nodes simultaneously.
In Grafana, our PromQL rate queries automatically sum throughput across all active application nodes, giving us true cluster-wide observability!"

---

### Outro (11:00 - 12:30)
"And that is how you turn a modular monolith into a resilient, horizontally-scalable, highly-available distributed system.

We now have:
- Nginx L7 Load Balancing & Automatic Failover
- Horizontally-scaled Spring Boot application nodes
- Redis distributed caching & rate limiting
- Apache Kafka KRaft click streaming
- Multi-shard PostgreSQL database partitioning
- Prometheus & Grafana cluster telemetry

All configuration files are available on GitHub in the `docker/nginx` directory.

If you enjoyed this architecture deep-dive, make sure to like, subscribe, star the repo on GitHub, and let me know in the comments what distributed system topic you want to tackle next!

Happy coding!"

---

## 4. Key Takeaways for Senior Engineering Interviews

1. **Failure Domain Isolation**: Never run single-node backends in production. Always design for node death as a normal operational event.
2. **L7 Retry Safety (`proxy_next_upstream`)**: Only retry idempotent methods (or stateful operations backed by deduplication keys) to avoid duplicate write side-effects during network timeouts.
3. **Connection Reuse**: Reverse proxies should always enable upstream HTTP/1.1 keepalives to prevent ephemeral socket exhaustion under high concurrency.
4. **Proxy Transparency**: Always ensure reverse proxies pass through client IP headers (`X-Forwarded-For`), and configure the application server's trusted proxy filter to avoid spoofing.

