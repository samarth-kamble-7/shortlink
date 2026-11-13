# Episode 13: Horizontal Database Sharding & Consistent Hashing

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 4, Day 13  
**Focus**: Consistent hashing with virtual nodes, Spring `AbstractRoutingDataSource`, multi-shard Flyway migrations, and multi-database topology.

---

## 1. Episode Objective

In Episode 12, we completed our time-series click aggregations and sliding analytics windows.

In this episode, we solve the ultimate database scalability bottleneck:
1. Implement a **Consistent Hash Ring** (`ConsistentHashRing.java`) with 160 virtual nodes per shard using 64-bit cryptographic hashing.
2. Build Spring's dynamic router (`DynamicRoutingDataSource.java` and `ShardRouter.java`) to transparently switch database connections per short code.
3. Automatically execute Flyway migrations across each physical shard on application startup.
4. Scale our Docker topology to multiple independent PostgreSQL databases (`postgres` on port 5432 and `postgres-shard1` on port 5433).

---

## 2. Architecture & Data Flow

```text
HTTP Request (e.g. POST /api/v1/links or GET /{shortCode})
       │
       ▼
 ShardRouter (ConsistentHashRing)
       │ (160 Virtual Nodes per Shard)
       │
       ├─► shortCode A ──► Ring ──► Shard 0 (PostgreSQL 5432)
       └─► shortCode B ──► Ring ──► Shard 1 (PostgreSQL 5433)
       │
       ▼
 DynamicRoutingDataSource (Spring AbstractRoutingDataSource)
       │
       ├─► Connection Pool: HikariPool-shard-0
       └─► Connection Pool: HikariPool-shard-1
```

---

## 3. Spoken Video Script

### Intro (0:00 - 1:15)
"Welcome back to the ShortLink engineering series! Over the last few episodes, we built a screaming-fast caching layer and real-time Kafka analytics.

Today, in Episode 13, we tackle the hardest scalability challenge in distributed systems:
*What happens when your database gets too big for a single computer?*

We're implementing Horizontal Database Sharding:
- Splitting links and clicks across multiple independent PostgreSQL databases.
- Using Consistent Hashing with virtual nodes so traffic is distributed evenly.
- Dynamically switching database connections on the fly without changing our business queries."

---

### Segment 1: Consistent Hashing with Virtual Nodes (1:15 - 3:30)
"Why not just use `shortCode.hashCode() % numberOfShards`?
Because simple modulo hashing creates severe hotspots, and if you add or remove a shard, almost 100% of your keys reshuffle to the wrong database!

Instead, we use a **Consistent Hash Ring** with 160 virtual nodes per physical shard:
```java
public String selectShard(String shortCode) {
    long hash = hash(shortCode);
    if (!ring.containsKey(hash)) {
        SortedMap<Long, String> tailMap = ring.tailMap(hash);
        hash = tailMap.isEmpty() ? ring.firstKey() : tailMap.firstKey();
    }
    return ring.get(hash);
}
```
Virtual nodes guarantee a smooth, uniform distribution of keys with minimal standard deviation, and adding a new shard only moves a tiny fraction of links."

---

### Segment 2: Dynamic Routing DataSource (3:30 - 5:30)
"How does Spring know which database to talk to?
We extend Spring's `AbstractRoutingDataSource`:
```java
public class DynamicRoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return ShardContextHolder.getShard();
    }
}
```
Whenever a request enters `LinkService` or `AnalyticsService`, `ShardRouter` sets the current shard key in a ThreadLocal context. Spring automatically grabs a database connection from the appropriate HikariCP pool (`HikariPool-shard-0` or `HikariPool-shard-1`)."

---

### Segment 3: Multi-Shard Flyway Schema Synchronization (5:30 - 7:00)
"When you have multiple shards, how do you keep their database schemas in sync?
In `ShardingConfiguration`, on application startup, we iterate over every configured shard and run Flyway migrations independently:
```java
Flyway flyway = Flyway.configure().dataSource(ds).load();
flyway.migrate();
```
Both `shard-0` and `shard-1` are guaranteed to have identical tables, indexes, and constraints before the application accepts traffic."

---

### Segment 4: Verification & Live Docker Cluster (7:00 - 9:30)
"Let's test it live!
In `docker-compose.yml`, we now have `shortlink-postgres` (Shard 0) and `shortlink-postgres-shard1` (Shard 1).
We create 10 links via our API.
Then, we open terminal sessions into both PostgreSQL containers and run `SELECT short_code FROM links`.
Behold: half the links are in Shard 0, and the other half are in Shard 1, working completely seamlessly!"

---

### Outro (9:30 - 10:00)
"Now our data layer can scale to billions of URLs! In Episode 14, we will add Prometheus and Grafana dashboards to monitor shard health, query latencies, and Kafka metrics. Make sure to like, subscribe, and star the repository on GitHub!"

