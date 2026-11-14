# Episode 19: Next.js 16 Server Actions, Secure HTTP-Only Auth & Custom Hooks

**Series**: ShortLink — Building a Distributed URL Shortener & Analytics Engine  
**Milestone**: Phase 6, Day 19  
**Focus**: Next.js 16 Server Actions (`'use server'`), Zero-XSS HTTP-only cookie bridge, TanStack Query `useAuth` custom hook, and clean authentication views using untouched shadcn primitives.

---

## 1. Episode Objective

In Episode 17, we engineered a production-grade distributed authentication system on our Spring Boot backend:
- Stateless HMAC-SHA256 JWT access tokens (15-minute TTL)
- Redis-backed refresh token rotation & instant logout revocation (7-day TTL)
- Snowflake user IDs & private multi-tenant dashboards

In **Episode 19**, we connect our Next.js 16 client to this backend with an uncompromising security architecture:
1. **Zero Next.js `/api` Route Handlers**: We bypass legacy REST proxy endpoints and use **Next.js Server Actions** (`'use server'`).
2. **Zero Client-Side Token Exposure**: Access tokens and refresh tokens are stored in **HTTP-only, secure, SameSite cookies**. The browser JavaScript never sees the raw JWT, completely eliminating XSS token theft.
3. **Transparent Silent Refresh**: Server Actions automatically detect expired access tokens and rotate tokens via Redis behind the scenes without user disruption.
4. **TanStack Query `useAuth` Hook**: Type-safe mutations, cache invalidation, and Sonner toast notifications.
5. **Untouched shadcn UI**: Clean `/login` and `/register` views built with unmodified vendor primitives.

---

## 2. Architecture: Server Actions & HTTP-Only Cookie Bridge

```text
 Browser (Client Component)
     │
     │ 1. invoke login(email, password) via custom hook useAuth()
     ▼
 Next.js Server Action ('use server' in app/actions/auth-actions.ts)
     │
     │ 2. POST http://localhost:8080/api/v1/auth/login
     ▼
 Spring Boot / Nginx Cluster (:8080)
     │
     │ 3. Validates BCrypt, returns { accessToken, refreshToken, user }
     ▼
 Next.js Server Action
     │
     │ 4. cookies().set('shortlink_access_token', token, { httpOnly: true, secure: true, maxAge: 900 })
     │    cookies().set('shortlink_refresh_token', token, { httpOnly: true, secure: true, maxAge: 604800 })
     │
     │ 5. Returns { success: true, user }
     ▼
 TanStack Query Cache (Client)
     │
     │ 6. Updates user query data & redirects to /dashboard
     ▼
 UI View (Sonner toast confirmation)
```

---

## 3. Spoken Video Script

### Intro (0:00 - 2:00)
"Welcome back to the ShortLink masterclass! In Episode 18, we scaffolded our Next.js 16 application and established our strict Anti-Slop design guidelines.

Today, in Episode 19, we are building the authentication layer between our Next.js frontend and our distributed Spring Boot cluster.

Here is a common junior developer pattern: storing JWTs in `localStorage` or `sessionStorage`, or building a bunch of Next.js `/api` Route Handlers that do nothing but pass JSON around.

Today, we are doing it the Staff Engineer way:
- **No `/api` routes whatsoever.**
- **Next.js Server Actions** executing directly on the server.
- **HTTP-only, secure cookies** that prevent any malicious JavaScript or third-party script from stealing user tokens.
- **TanStack Query** powering our client-side state with custom hooks.

Let's dive into the code!"

---

### Segment 1: Why Server Actions Beat `/api` Route Handlers (2:00 - 4:30)
"Look at `client/app/actions/auth-actions.ts`:

```typescript
'use server';

export async function loginAction(input: LoginInput): Promise<AuthActionResult> { ... }
```

Why do we use Server Actions instead of creating an `app/api/auth/login/route.ts`?
1. **Type Safety Across Network Boundaries**: The input and output types are verified at compile time. No manual string parsing or extra fetch wrapper libraries needed.
2. **Direct Cookie Control**: In Next.js, `cookies()` is an async helper that allows the server action to set HTTP-only cookies directly in the response headers.
3. **Zero Token Exposure**: The raw JWT access token and refresh token never touch the browser's JavaScript memory. If an attacker injects an XSS script, they cannot access `document.cookie` or `localStorage` to steal the token!"

---

### Segment 2: Silent Token Refresh (4:30 - 7:30)
"What happens when the 15-minute access token expires while a user is browsing?

Look at `getProfileAction()` in `auth-actions.ts`:
1. The server action attempts to read `shortlink_access_token`.
2. If the access token is missing or expired, but `shortlink_refresh_token` exists, it calls `POST http://localhost:8080/api/v1/auth/refresh`.
3. The Spring Boot backend rotates the refresh token in Redis and issues a fresh access token.
4. The server action updates the HTTP-only cookies and queries the user profile.
5. The user experiences **zero downtime, zero flicker, and zero logouts**—all handled securely on the server!"

---

### Segment 3: Custom Hook `useAuth` & TanStack Query (7:30 - 10:00)
"Now look at `client/hooks/use-auth.ts`:

We wrap our server actions in TanStack Query:
- `useQuery` fetches the current user session (`['auth', 'profile']`).
- `useMutation` triggers `loginAction`, `registerAction`, and `logoutAction`.
- When login succeeds, we invalidate the query cache, trigger a **Sonner toast notification**, and navigate to the dashboard.
- If the backend returns an RFC 7807 problem details error (like `401 Bad Credentials` or `409 Conflict`), the error detail is extracted and displayed in an error toast."

---

### Segment 4: Building the Views with Untouched shadcn (10:00 - 12:30)
"Let's look at `/login` and `/register`:

Notice how we built these screens:
- We imported untouched `Card`, `Input`, and `Button` from `components/ui/*`.
- We used standard semantic variables: `bg-card`, `border-border`, `text-foreground`.
- **Zero purple gradients. Zero pill buttons. Zero emoji badges.**
- Pure, focused software craft that works seamlessly across Dark and Light themes."

---

### Outro (12:30 - 14:00)
"And that is how you build a secure, enterprise-grade authentication bridge in modern Next.js!

In **Episode 20**, we will build the public link shortening interface: instant Base62 generation, 1-click clipboard copy, and dynamic SVG QR code generation with sub-millisecond redirect feedback.

Hit the subscribe button, star the GitHub repository, and see you in Episode 20!"

