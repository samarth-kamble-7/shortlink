# Episode 4: Core REST APIs, HTTP 302 Redirect Engine & SSRF Defense

- **Commit SHA:** `30b9c7e`
- **Commit Summary:** `feat(api): implement link creation, HTTP 302 redirect, soft delete, SSRF defense, and Postman collection`
- **Video Title Idea:** *Building High-Performance Redirect APIs with SSRF Protection & Postman in Spring Boot (Episode 4)*

---

## 1. Intro & The Hook (0:00 – 0:30)

**What to show on screen:** Open Postman with the `ShortLink API v1` collection ready.

**What to say:**
> *"Welcome back to Episode 4 of ShortLink! Over our previous episodes, we built our Snowflake ID generator and our PostgreSQL storage layer.
>
> Today, we bring the entire system to life with our **Core REST APIs and HTTP Redirect Engine**! We will build URL creation, link resolution, soft deletion, and critical **SSRF defense** to prevent attackers from hitting internal cloud metadata services. Then, we will test everything live in **Postman** and our web browser! Let's get started."*

---

## 2. Architecture & Code Walkthrough (0:30 – 2:00)

### 1. SSRF Defense (`UrlValidator.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/service/validator/UrlValidator.java`.
* **Senior Engineering Point:**
  > *"When building a URL shortener, malicious actors will attempt **Server-Side Request Forgery (SSRF)** by asking your server to shorten `http://169.254.169.254` (the AWS/GCP cloud metadata endpoint) or `http://localhost:8080/actuator/health`.*
  >
  > *Our `UrlValidator` performs deep IP inspection: it checks against loopback (`127.0.0.1`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local addresses, rejecting them with an immediate `400 Bad Request`."*

### 2. The Redirect Controller: 301 vs 302 (`RedirectController.java`)
* **Show on screen:** Open `src/main/java/com/shortlink/api/RedirectController.java`.
* **Talking Points:**
  > *"Notice how the redirect is returned:*
  >
  > ```java
  > return ResponseEntity.status(HttpStatus.FOUND)
  >         .header(HttpHeaders.LOCATION, longUrl)
  >         .build();
  > ```
  >
  > *Notice we return **`HTTP 302 Found`**, NOT `HTTP 301 Moved Permanently`. Why?*
  > *If you return `301`, the client's browser caches the redirect forever. That means subsequent clicks never hit your server, completely breaking your real-time analytics and click tracking! With `302 Found`, every click reaches your server."*

### 3. Soft Deletion & 410 Gone
* **Show on screen:** Highlight the deleted link handling:
  > *"When a user deletes a link via `DELETE /api/v1/links/{shortCode}`, we don't wipe it from the database — we perform a soft delete by setting `is_active = false`. If anyone tries to access that short link afterward, our server returns **`HTTP 410 Gone`**, letting the client know the resource previously existed but was intentionally removed."*

---

## 3. Live Demonstration in Postman & Terminal (2:00 – 3:15)

### Step 1: Run the Automated Integration Tests
```bash
./mvnw test -Dtest=LinkControllerIntegrationTest
```
*Show all 7 integration tests passing on screen.*

### Step 2: Live Postman Walkthrough
Open Postman and execute the requests sequentially from `docs/postman/ShortLink_API_v1.postman_collection.json`:

1. **Create Short Link (`POST /api/v1/links`):**
   - Payload: `{"longUrl": "https://github.com/samarth-kamble-7/shortlink"}`
   - **Show response:** `201 Created` with generated short code (e.g., `4kLm8Z`).
2. **Create Vanity Alias:**
   - Payload: `{"longUrl": "https://github.com/samarth-kamble-7/shortlink", "customAlias": "github"}`
   - **Show response:** `201 Created` with `shortCode: "github"`.
3. **Trigger SSRF Block:**
   - Payload: `{"longUrl": "http://127.0.0.1:8080/actuator"}`
   - **Show response:** `400 Bad Request` with message: *"URL points to a private or loopback IP address"*.
4. **Live Browser Redirect:**
   - Paste `http://localhost:8080/github` into Chrome/Safari address bar.
   - **Hit enter:** Watch the browser instantly redirect to the GitHub repository!
5. **Soft Delete (`DELETE /api/v1/links/github`):**
   - **Show response:** `204 No Content`.
6. **Verify 410 Gone:**
   - Try `GET http://localhost:8080/github` again.
   - **Show response:** `410 Gone`!

---

## 4. Senior Interview Flex & Outro (3:15 – 3:45)

**Interview Question:** *"What HTTP status code should a URL shortener return, and what are the trade-offs?"*

**The Answer:**
> *"Use `HTTP 302 Found` (or `HTTP 307 Temporary Redirect`) when click tracking, real-time analytics, or link expiration are needed, because the client must query the server on each request.*
> *Use `HTTP 301 Moved Permanently` only when you want to minimize server load and offload redirects completely to browser and CDN caches at the cost of losing click analytics.*
>
> *In **Episode 5**, we reach the grand finale of Phase 1: we package our entire application into a production multi-stage **Dockerfile**, orchestrate it with **Docker Compose**, and benchmark our redirect engine using **k6**! Hit subscribe, check out the code on GitHub, and see you in Episode 5!"*

