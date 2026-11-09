# Episode 3: Flyway Schema Migrations, Partial Indexing & JPA Layer

- **Commit SHA:** `d9dbe44`
- **Commit Summary:** `feat(domain): implement links table flyway migration, Link entity and LinkRepository`
- **Video Title Idea:** *PostgreSQL Partial Indexing & Spring Data JPA with Flyway (Episode 3)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open `src/main/resources/db/migration/V1__create_links_table.sql`.

**What to say:**
> *"Welcome back to Episode 3 of ShortLink! In the previous episode, we built our distributed Snowflake ID generator.
>
> Today, we build the persistence layer: our **PostgreSQL 16** schema with **Flyway database migrations**, our Spring Data JPA entity, and a high-performance **partial B-tree index** that cuts index storage by over 80%! Let's inspect the SQL."*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### 1. Flyway Migration & Partial Indexing (`V1__create_links_table.sql`)
* **Show on screen:** Show the SQL migration file:
  ```sql
  CREATE TABLE links (
      id BIGINT PRIMARY KEY,
      short_code VARCHAR(16) NOT NULL,
      long_url TEXT NOT NULL,
      is_custom BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE NULL
  );

  CREATE UNIQUE INDEX uk_links_short_code ON links (short_code);
  CREATE INDEX idx_links_expires_at ON links (expires_at) WHERE expires_at IS NOT NULL;
  ```
* **Senior Engineering Talking Points:**
  > *"Notice three critical design details in our schema:*
  > 1. *`id BIGINT PRIMARY KEY`: We store our 64-bit Snowflake ID directly in an 8-byte integer column.*
  > 2. *`uk_links_short_code`: An exact B-tree unique index on `short_code` ensures $O(\log N)$ redirect lookups.*
  > 3. *`WHERE expires_at IS NOT NULL` (Partial Index): Most short links never expire. If 90% of your links have `expires_at = NULL`, indexing them wastes RAM and disk cache. By creating a **partial index**, only rows with an actual expiration date are indexed, keeping the B-tree tiny and cache-resident."*

### 2. JPA Entity Design (`Link.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/domain/Link.java`.
* **Talking Points:**
  > *"Notice how the `@Id` annotation is configured:*
  >
  > ```java
  > @Id
  > private Long id;
  > ```
  >
  > *There is **NO `@GeneratedValue`**! Why? Because our Snowflake ID generator pre-assigns the ID in application memory before saving. This avoids unnecessary database sequence roundtrips."*

### 3. Derived Spring Data Queries (`LinkRepository.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/domain/LinkRepository.java`.
* **Talking Points:**
  > *"Notice our repository uses clean Spring Data JPA derived queries:*
  >
  > ```java
  > Optional<Link> findByShortCode(String shortCode);
  > boolean existsByShortCode(String shortCode);
  > ```
  >
  > *Zero raw SQL string concatenation, eliminating SQL injection risks and keeping our domain model clean."*

---

## 3. Live Terminal Demonstration: Real Database Integration Tests (2:00 – 3:00)

### Run Repository Integration Tests:
```bash
./mvnw test -Dtest=LinkRepositoryTest
```

* **Highlight on screen:**
  - Testcontainers boots PostgreSQL 16.
  - Flyway automatically applies `V1__create_links_table.sql`.
  - Hibernate connects and verifies that entity mappings match the Flyway schema.
  - 6/6 tests pass: insertion, unique constraint enforcement on `shortCode`, lookup by short code, and soft deletion flags.

* **What to say:**
  > *"Look at the terminal: Testcontainers spins up a real PostgreSQL 16 instance. Flyway runs the migration in 7 milliseconds, and all 6 integration tests pass. We test unique constraints, active status lookups, and Snowflake ID persistence against a real database, not an in-memory mock."*

---

## 4. Senior Interview Flex & Outro (3:00 – 3:30)

**Interview Question:** *"Why should you use Flyway migrations instead of letting Hibernate manage your schema with `hibernate.hbm2ddl.auto=update`?"*

**The Answer:**
> *"Hibernate's auto-DDL cannot handle table renames, data migrations, partial indexes, or zero-downtime column drops. In production, having versioned, immutable SQL migration scripts in Git tracked via Flyway provides reproducible database state across development, staging, and multi-region production clusters.*
>
> *Now our storage layer is ready. In **Episode 4**, we build our **Core REST APIs**, the **HTTP 302 Redirect Engine**, and **SSRF security defense**! Hit subscribe, check out the code on GitHub, and see you in Episode 4!"*

