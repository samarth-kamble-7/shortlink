# Episode 4: Core REST APIs, Redirect Engine & Postman Testing

This guide contains the exact video script, file walkthrough, and interactive Postman demonstration steps for Episode 4.

---

## Git Commit Details

- **Type:** `feat`
- **Scope:** `api`
- **Commit Summary:** `feat(api): implement link creation, HTTP 302 redirect, soft delete, SSRF defense, and Postman collection`
- **Detailed Message:**
  ```text
  feat(api): implement link creation, HTTP 302 redirect, soft delete, SSRF defense, and Postman collection

  - Add POST /api/v1/links for link creation (Snowflake + Base62 or custom alias)
  - Add GET /{shortCode} with HTTP 302 Temporary Redirect
  - Add GET /api/v1/links/{shortCode} for link metadata
  - Add DELETE /api/v1/links/{shortCode} for soft deletion (returns 204)
  - Add UrlValidator with SSRF defense (blocking localhost, 127.0.0.1, private IPs, and cloud metadata)
  - Add AliasValidator for pattern checks and reserved word blocking (api, actuator, health, admin)
  - Add GlobalExceptionHandler for consistent JSON error responses (400, 404, 409, 410)
  - Add docs/postman/ShortLink_API_v1.postman_collection.json
  - Add integration tests in LinkControllerIntegrationTest
  ```

---

## Exact Video Script & Walkthrough

### Part 1: Intro & The Big Picture (20 Seconds)

> "Welcome back! In our previous episodes, we built our Snowflake ID generator and our PostgreSQL storage layer. 
> 
> Today in Episode 4, we bring everything to life by building our **Core REST APIs and Redirect Engine**! We'll test each endpoint live using **Postman** and our web browser."

---

### Part 2: Code Walkthrough (60 Seconds)

#### 1. Security & Validation (`UrlValidator.java` & `AliasValidator.java`)
- **Show on screen:** Open `UrlValidator.java`.
- **Key Talking Points:**
  - **SSRF (Server-Side Request Forgery) Protection:** "If a malicious user tries to shorten `http://localhost:8080/actuator/health` or `169.254.169.254`, our validator detects loopback and private IP ranges and immediately blocks them with a `400 Bad Request`."
  - **Reserved Aliases:** "In `AliasValidator.java`, we forbid users from taking system paths like `shortlink.com/api` or `shortlink.com/actuator`."

#### 2. The Redirect Controller (`RedirectController.java`)
- **Show on screen:** Open `RedirectController.java`.
- **Senior Interview Point:**
  > "Notice we return **`HTTP 302 Found`**, NOT `HTTP 301 Moved Permanently`.
  > Why? With 301, the user's browser permanently caches the destination URL and will never hit our server again. With **302**, every single click reaches our server so our upcoming Kafka analytics stay 100% accurate!"

#### 3. Handling Custom Alias Collisions (`LinkService.java`)
- **Show on screen:** Highlight the `try-catch` around `saveAndFlush()` in `LinkService.java`.
- **Key Talking Points:**
  - "Instead of a buggy 'check-then-insert' pattern that suffers from race conditions when two users submit at the exact same millisecond, we let PostgreSQL's unique constraint enforce uniqueness and catch `DataIntegrityViolationException`, translating it to `HTTP 409 Conflict`."

---

### Part 3: Live Postman Demonstration (Show Postman on Screen)

Import the collection from:
`docs/postman/ShortLink_API_v1.postman_collection.json`

#### Test 1: Create a Short Link (Auto-Generated Code)
- **Method:** `POST http://localhost:8080/api/v1/links`
- **Body:**
  ```json
  {
    "longUrl": "https://github.com/samarth-kamble-7/shortlink"
  }
  ```
- **Click Send:** Shows **`201 Created`** with an auto-generated 7-character Base62 code!

#### Test 2: Create a Custom Alias
- **Method:** `POST http://localhost:8080/api/v1/links`
- **Body:**
  ```json
  {
    "longUrl": "https://en.wikipedia.org/wiki/Distributed_computing",
    "customAlias": "my-portfolio"
  }
  ```
- **Click Send:** Shows **`201 Created`** with `shortCode: "my-portfolio"`.

#### Test 3: The 302 Redirect in Chrome Browser!
- Open Chrome and paste: `http://localhost:8080/my-portfolio`
- **Watch it immediately redirect to Wikipedia!**

#### Test 4: Testing Security (SSRF Protection)
- **Method:** `POST http://localhost:8080/api/v1/links`
- **Body:**
  ```json
  {
    "longUrl": "http://localhost:8080/actuator/health"
  }
  ```
- **Click Send:** Shows **`400 Bad Request`**:
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Access to localhost and internal services is forbidden (SSRF protection)"
  }
  ```

#### Test 5: Soft Delete & 410 Gone
- Run `DELETE http://localhost:8080/api/v1/links/my-portfolio` $\rightarrow$ **`204 No Content`**.
- Now open `http://localhost:8080/my-portfolio` in browser $\rightarrow$ Shows **`410 Gone`**!

