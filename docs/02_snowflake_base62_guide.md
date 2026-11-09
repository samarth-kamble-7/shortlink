# Episode 2: Distributed Snowflake ID Generator & Base62 Encoder

This document contains the exact recording script, talking points, file walkthrough, and live verification commands for Episode 2.

---

## Git Commit Details

- **Type:** `feat`
- **Scope:** `idgen`
- **Commit Summary:** `feat(idgen): implement 64-bit Snowflake ID generator and Base62 encoder`
- **Detailed Message:**
  ```text
  feat(idgen): implement 64-bit Snowflake ID generator and Base62 encoder

  - Implement Base62Encoder with O(1) array-based decoding table and overflow protection
  - Implement 64-bit SnowflakeIdGenerator (41-bit timestamp, 10-bit node ID, 12-bit sequence)
  - Add ClockMovedBackwardsException and NTP backward drift handling
  - Add sequence exhaustion handling (waiting for next millisecond)
  - Configure shortlink.node-id and shortlink.custom-epoch in application.yml
  - Add comprehensive unit tests verifying 100,000 concurrent IDs without collisions
  - Add Episode 2 recording script and guide in docs/
  ```

---

## Exact Recording Script & Walkthrough

### Step 1: The Chapter Title & Hook (15–30 Seconds)

**What to say:**

> "Welcome back! In Episode 1, we set up our core infrastructure and Docker environment. Today, we're building the heart of ShortLink: our distributed ID generator and Base62 encoder.
>
> When someone gives us a long URL, how do we turn it into a short code like `shortlink.com/aB3x9Q` without choking the database? We generate a unique 64-bit Snowflake ID in RAM and encode it into Base62. Let's break down the code."

---

### Step 2: Architecture & Bit Breakdown (Show Diagram on Screen)

**What to show:** Open this breakdown or diagram:
```text
 0 (1 bit)   41 bits (Timestamp)       10 bits (Node)   12 bits (Sequence)
┌─┬───────────────────────────────────┬──────────────┬────────────────────┐
│0│ Milliseconds since custom epoch   │ Node ID      │ Counter (0..4095)  │
└─┴───────────────────────────────────┴──────────────┴────────────────────┘
```

**What to say:**
> "A Snowflake ID is a 64-bit integer packed with 3 key pieces of information:
> 1. **Sign bit (1 bit)**: Kept at `0` so the number is always positive.
> 2. **Timestamp (41 bits)**: Milliseconds since our custom epoch (Jan 1, 2026). $2^{41}$ gives us nearly 70 years of lifespan.
> 3. **Node ID (10 bits)**: Supports up to 1,024 independent server instances.
> 4. **Sequence (12 bits)**: Allows up to 4,096 IDs per millisecond per node—that's over 4 million IDs per second on a single machine!
>
> Because time continuously moves forward and each server has its own Node ID, no two servers can ever generate the same number."

---

### Step 3: Walkthrough of the Key Files (Show These on Screen)

#### 1. `Base62Encoder.java`
- **What to show on screen:** Open `src/main/java/com/shortlink/idgen/Base62Encoder.java`.
- **Key points to explain:**
  - **Alphabet**: `0-9`, `a-z`, `A-Z` (62 characters).
  - **Why Base62?**: "Base10 only has 10 digits, so a 64-bit ID looks like `154829384729103948` (18 digits). In Base62, each character holds 62 possibilities, shrinking that 18-digit number into a clean 7-to-8 character code like `k9X4mP2`."
  - **$O(1)$ Lookup Table**: "Instead of doing slow string searches (`indexOf`), we use a precomputed 128-byte lookup array (`int[] DECODE_TABLE`) for instantaneous character decoding."
  - **Overflow Defense**: "Notice the check `result > (Long.MAX_VALUE - digit) / BASE` before multiplying. This prevents arithmetic overflow if someone submits an excessively long malicious string."

#### 2. `SnowflakeIdGenerator.java`
- **What to show on screen:** Open `src/main/java/com/shortlink/idgen/SnowflakeIdGenerator.java`.
- **Key points to explain:**
  - **Thread-Safety**: "`synchronized` on `nextId()` ensures atomic state transitions between the sequence counter and timestamp."
  - **Sequence Overflow**: "What if a node gets hammered with more than 4,096 requests in the exact same millisecond? `tilNextMillis()` spin-waits until the clock advances to the next millisecond, resetting the sequence to 0."
  - **Clock Drift Protection**: "In distributed systems, Network Time Protocol (NTP) can cause server clocks to drift backwards. If the clock moves back $\le 5\text{ms}$, we wait for it to catch up. If it jumps back $> 5\text{ms}$, we fail-fast by throwing `ClockMovedBackwardsException` rather than risking duplicate IDs."

#### 3. `application.yml`
- **What to show on screen:** Open `src/main/resources/application.yml`.
- **Key points to explain:**
  - `shortlink.node-id: ${SHORTLINK_NODE_ID:1}`: Configurable per container/instance via environment variable.
  - `shortlink.custom-epoch: 1767225600000`: Set to Jan 1, 2026.

---

### Step 4: Terminal Demo (The Stress Test Proof)

**What to run in your terminal to show viewers:**

1. **Run Unit Tests & Concurrency Stress Test:**
   ```bash
   ./mvnw test -Dtest=Base62EncoderTest,SnowflakeIdGeneratorTest
   ```

2. **What to point out on screen:**
   - Show all 26 tests passing.
   - Highlight the **multi-threaded stress test**: 50 concurrent threads generating 2,000 IDs each ($100,000$ total IDs) verified into a thread-safe `Set` with **zero duplicates** in under 150 milliseconds!
   - Highlight the sequence overflow and clock drift tests verifying edge-case safety.

