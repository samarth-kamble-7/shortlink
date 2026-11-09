# Episode 3: Database Schema Migration, Domain Entity & Repository

This document contains the exact recording script, talking points, file walkthrough, and live verification commands for Episode 3.

---

## Git Commit Details

- **Type:** `feat`
- **Scope:** `domain`
- **Commit Summary:** `feat(domain): implement links table flyway migration, Link entity and LinkRepository`
- **Detailed Message:**
  ```text
  feat(domain): implement links table flyway migration, Link entity and LinkRepository

  - Add V1__create_links_table.sql Flyway migration with PostgreSQL partial index on expires_at
  - Add Link JPA entity with assigned 64-bit Snowflake ID (no @GeneratedValue)
  - Add LinkRepository with derived query methods (zero raw SQL queries)
  - Add real PostgreSQL 16 Testcontainers integration tests in LinkRepositoryTest
  - Enforce strict Hibernate ddl-auto: validate schema matching
  - Add Episode 3 recording script and guide in docs/
  ```

---

## Exact Recording Script & Walkthrough

### Step 1: The Chapter Title & Hook (15–30 Seconds)

**What to say:**

> "Welcome back! In Episode 2, we built our Snowflake ID generator and Base62 encoder. Today in Episode 3, we build the storage layer: saving links to PostgreSQL.
>
> But here's the twist: we are NOT going to let Hibernate auto-create tables from Java, and we are NOT going to use database auto-increment IDs. We're doing it the production way using version-controlled Flyway migrations, PostgreSQL partial indexes, and pure Spring Data JPA with zero raw SQL queries."

---

### Step 2: The Senior Interview Question (Show Notes on Screen)

**What to show:** Open `docs/03_database_and_domain_guide.md` or present these 3 points:

1. **Why Flyway instead of Hibernate `ddl-auto: update`?**
   - **No Data Loss:** Renaming a Java field with Hibernate `update` creates a new duplicate column and orphans old data. Flyway migrations are explicit and safe.
   - **Multi-Server Safety:** Multiple application instances starting simultaneously will fight to alter the table, causing database deadlocks. Flyway uses a distributed lock table (`flyway_schema_history`).
   - **Git for Your Database:** Migrations are versioned, audited, and reviewed in Pull Requests.

2. **The Golden Rule to Explain:**
   - **Flyway** builds the tables.
   - **Java** maps the domain model.
   - **Hibernate** validates that both match on startup using `ddl-auto: validate`.

---

### Step 3: Walkthrough of the Key Files (Show These on Screen)

#### 1. `V1__create_links_table.sql`
- **What to show on screen:** Open `src/main/resources/db/migration/V1__create_links_table.sql`.
- **Key points to explain:**
  - `id BIGINT PRIMARY KEY`: Receives our 64-bit Snowflake ID.
  - `short_code VARCHAR(16) NOT NULL UNIQUE`: Ensures no duplicate short codes.
  - `is_active BOOLEAN DEFAULT TRUE`: Allows soft deletion (we never hard-delete analytics history).
  - **The Partial Index Flex:**
    ```sql
    CREATE INDEX idx_links_expires_at ON links (expires_at) WHERE expires_at IS NOT NULL;
    ```
    > "Most links are permanent and never expire (`expires_at IS NULL`). Indexing nulls wastes precious RAM. This partial index indexes ONLY expiring links, making the index 90% smaller and blazing fast in PostgreSQL's buffer cache!"

#### 2. `Link.java`
- **What to show on screen:** Open `src/main/java/com/shortlink/domain/Link.java`.
- **Key points to explain:**
  - Notice the `@Id` on `private Long id;` has **NO `@GeneratedValue`**.
  - Why? "Beginners let the database generate IDs using sequences or auto-increment. We generate our 64-bit Snowflake ID in RAM *before* calling `save()`, completely removing database ID generation bottlenecks."

#### 3. `LinkRepository.java`
- **What to show on screen:** Open `src/main/java/com/shortlink/domain/LinkRepository.java`.
- **Key points to explain:**
  - Zero raw SQL queries.
  - Derived methods: `findByShortCode(String shortCode)` and `findByShortCodeAndIsActiveTrue(String shortCode)`.
  - Type-safe, clean, and maintainable.

---

### Step 4: Terminal Demo (The Live Proof)

**What to run in your terminal to show viewers:**

1. **Run the Repository Integration Test Suite:**
   ```bash
   ./mvnw test -Dtest=LinkRepositoryTest
   ```

2. **What to point out on screen:**
   - Watch Testcontainers boot real PostgreSQL 16 Alpine.
   - Point out Flyway executing `V1__create_links_table.sql`.
   - Point out Hibernate validating the schema with `ddl-auto: validate`.
   - Highlight the test for **race protection**: inserting duplicate `short_code` triggers `DataIntegrityViolationException` at the database level!

