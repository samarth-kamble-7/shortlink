# Episode 9: Apache Kafka Integration & Async Click Event Streaming

- **Commit Scope:** `feat(analytics)`
- **Commit Summary:** `feat(analytics): integrate Apache Kafka (KRaft) and async non-blocking ClickEvent producer`
- **Video Title Idea:** *Event-Driven Click Analytics with Apache Kafka KRaft & Java 25 Virtual Threads (Episode 9)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `README.md` showing the architecture diagram (`docs/images/architecture.png`).

**What to say:**
> *"Welcome to **Phase 3** of building ShortLink! In Phase 2, we scaled our redirect engine to **10,920+ requests/sec** by keeping PostgreSQL off the hot redirect path.*
>
> *Now we want real-time **Click Analytics** — tracking every click's timestamp, IP address, browser User-Agent, and referrer. If we wrote `INSERT INTO click_events` to PostgreSQL on every redirect, our latency would skyrocket!*
>
> *Today in **Episode 9**, we add **Apache Kafka in KRaft mode** (no Zookeeper needed!) and emit asynchronous, non-blocking click events on a Java 25 Virtual Thread so user redirects stay sub-millisecond!"*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### 1. Apache Kafka in KRaft Mode (`docker-compose.yml`)
* **Show on screen:** Open `docker-compose.yml` around the `kafka` service.
* **Talking Points:**
  > *"Notice we use the official `apache/kafka:3.9.0` image running in **KRaft mode** — no separate Zookeeper container required! Our `app` container waits for PostgreSQL, Redis, AND Kafka to pass their healthchecks before starting."*

### 2. High-Throughput Producer Tuning (`application.yml` & `KafkaConfig.java`)
* **Show on screen:** Open `src/main/resources/application.yml` around `spring.kafka.producer`.
* **Senior Engineering Highlights:**
  > *"Look closely at three production Kafka settings:*
  > 1. *`linger.ms: 10` + `batch-size: 32768` + `compression-type: lz4`: Instead of sending 10,000 tiny network packets per second, Kafka batches and compresses click events together.*
  > 2. *`max.block.ms: 500`: By default, Kafka's producer blocks for **60 seconds** if broker metadata isn't reachable! We cap it at 500ms.*
  > 3. *`NewTopic` with **3 partitions** in `KafkaConfig.java`: Partitioning by `shortCode` guarantees all clicks for the same link arrive in strict chronological order while enabling parallel consumer workers in Episode 10."*

### 3. Non-Blocking Virtual Thread Producer (`ClickEventProducer.java` & `RedirectController.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/analytics/ClickEventProducer.java` and `RedirectController.java`.
* **Talking Points:**
  > *"Look at `ClickEventProducer.publishClick()`:*
  >
  > ```java
  > Thread.startVirtualThread(() -> {
  >     String payload = jsonMapper.writeValueAsString(event);
  >     kafkaTemplate.send(clicksTopic, event.shortCode(), payload)
  >         .whenComplete(...);
  > });
  > ```
  >
  > *The HTTP 302 redirect thread NEVER waits for JSON serialization or Kafka broker acknowledgments. Even if Kafka restarts, redirects continue at full speed with zero errors!"*

---

## 3. Live Terminal & Kafka Consumer Demo (2:00 – 3:15)

### Step 1: Run the Kafka Integration Test
```bash
./mvnw test -Dtest=ClickEventProducerIntegrationTest
```
* **Highlight on screen:** Testcontainers starts PostgreSQL 16 + Redis 7 + Apache Kafka 3.9.0 together, fires a `GET /kafka-test` request, and consumes the exact `ClickEvent` JSON from `shortlink.clicks`.

### Step 2: Live Docker Compose & `kafka-console-consumer`
Start the full stack:
```bash
docker compose up --build -d
docker compose ps
```
Open a live Kafka consumer in your terminal:
```bash
docker exec -it shortlink-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic shortlink.clicks \
  --from-beginning \
  --property print.key=true
```
In another terminal, create a link and click it:
```bash
curl -X POST http://localhost:8080/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"longUrl": "https://github.com/samarth-kamble-7/shortlink", "customAlias": "kafka-demo"}'

curl -i -A "Mozilla/5.0 (Macintosh)" -e "https://youtube.com" http://localhost:8080/kafka-demo
```
**Say:** *"Look at the Kafka consumer terminal: within milliseconds, the exact click JSON event appeared — partitioned by key `kafka-demo`, complete with `userAgent`, `referrer`, `clientIp`, and `clickedAt`!"*

---

## 4. Senior Interview Flex & Outro (3:15 – 3:45)

**Interview Question:** *"Why should you partition click events by `shortCode` in Kafka, and what happens if one link goes super viral?"*

**The Answer:**
> *"Partitioning by `shortCode` guarantees **per-link message ordering** and lets downstream consumers aggregate counts per link in local memory.*
>
> *However, if one link goes viral (the **hot partition problem**), that single partition receives heavy traffic. In high-scale systems, you mitigate hot partitions by salting the key (e.g., `shortCode#0` through `shortCode#9`) or using stateless consumer workers that flush batch increments to Redis/PostgreSQL.*
>
> *In **Episode 10**, we will build our **Click Analytics Consumer Worker** to parse User-Agent devices/browsers and persist click telemetry into PostgreSQL! See you in Episode 10!"*

