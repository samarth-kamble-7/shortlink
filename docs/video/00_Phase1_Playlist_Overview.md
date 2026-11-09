# ShortLink Phase 1: Complete YouTube Video Series Guide

Welcome to the complete production recording guide for **ShortLink Phase 1: The Modular Monolith Foundation**.

This directory contains the exact, word-for-word scripts, screen walkthroughs, senior engineering interview talking points, and terminal demonstration commands mapped directly to each Git commit.

---

## Series Structure & Episode Guide

| Episode | Title & Topic | Corresponding Commit | Key Files to Walk Through |
| :--- | :--- | :--- | :--- |
| **[Episode 1](./Episode_01_Project_Skeleton_and_Docker_Postgres.md)** | **Project Skeleton & Core Infrastructure** | `07322f8` / `2a1c65c` | `docker-compose.yml`, `application.yml`, `PingController.java`, `ShortlinkApplicationTests.java` |
| **[Episode 2](./Episode_02_Snowflake_ID_Generator_and_Base62.md)** | **Twitter Snowflake 64-bit ID Generator & Base62** | `015af4e` | `SnowflakeIdGenerator.java`, `Base62Encoder.java`, `SnowflakeIdGeneratorTest.java` |
| **[Episode 3](./Episode_03_Flyway_Database_Migration_and_JPA.md)** | **Flyway Schema Migrations, JPA & Testcontainers** | `d9dbe44` | `V1__create_links_table.sql`, `Link.java`, `LinkRepository.java`, `LinkRepositoryTest.java` |
| **[Episode 4](./Episode_04_REST_APIs_Redirect_Engine_and_Postman.md)** | **Core REST APIs, HTTP 302 Redirect Engine & SSRF Defense** | `30b9c7e` | `LinkController.java`, `RedirectController.java`, `UrlValidator.java`, Postman Collection |
| **[Episode 5](./Episode_05_Production_Docker_and_k6_Benchmarks.md)** | **Production Multi-Stage Dockerfile, Compose & k6 Benchmarks** | `feat(deploy)` | `Dockerfile`, `docker-compose.yml`, `k6/baseline-redirect-test.js`, `README.md` |

---

## Recommended Video Setup & Tips for the Creator

1. **Resolution & Font Size:**
   - Screen resolution: 1080p (1920x1080) or 1440p (2560x1440).
   - IDE Font size: Set editor font to **16pt–18pt** so viewers on mobile devices can easily read your code.
   - Terminal Font size: Set to **18pt–20pt** with a clean dark theme.

2. **Presentation Flow for Every Episode:**
   - **0:00 - 0:20 | The Hook:** State what problem we are solving today and why it matters in high-scale distributed systems.
   - **0:20 - 1:45 | Architecture & Code Walkthrough:** Show the code in the IDE, highlighting senior design patterns (e.g., bitwise arithmetic, SSRF defense, partial indexing, non-root Docker users).
   - **1:45 - 3:00 | Live Verification:** Run the tests, curl commands, or Docker commands in the terminal so viewers see real, passing output.
   - **3:00 - 3:30 | Senior Interview Flex & Outro:** Explain an interview-level question related to the topic, tell viewers to check the GitHub repo in the description, and tease the next episode.

