# Admin Authorization Audit & Guide (`admin-authorization.md`)

**Scan Date:** 2026-11-17  
**Status:** Permanent Fixes Implemented & Verified (`npx tsc --noEmit` + Security Tests Passing)  
**Triggered Incident:**  
`POST /api/campuses/1500504d-9eef-4864-b585-8fe97032f119/classrooms 403 in 17.2s (compile: 12.2s, proxy.ts: 13ms, render: 5.0s)`

---

## 1. Executive Summary

Your admin account **already has full `admin` privileges in the PostgreSQL database** — there is **no separate admin authorization flag, secondary approval toggle, or extra permission step** to enable.

Our scan of the authentication stack, API routes, Zustand store, and Neon PostgreSQL database identified **three exact technical reasons** why an already logged-in administrator receives `403 Forbidden: Admin privileges required` on `POST /api/campuses/[campusId]/classrooms` (and similar admin endpoints):

1. **Primary Root Cause (Exact Match for `render: 5.0s`): Neon 5-Second Connection Timeout Swallowed as `403 Forbidden`**
   - `db/client.ts:42` enforces `connectionTimeoutMillis: 5000` (5.0 seconds).
   - When Neon PostgreSQL wakes from serverless idle sleep (or hits brief network latency >5s), `pg.Pool` throws `Connection terminated due to connection timeout` at **5.0s**.
   - `lib/auth.ts:600-621` (`authService.getCurrentUser`) catches **all** errors (including DB connection timeouts) and silently returns `null`.
   - `app/api/campuses/[campusId]/classrooms/route.ts:35-38` checks `if (!user || user.role !== "admin")`, treats `user === null` as a permission failure, and returns **`403 Forbidden: Admin privileges required`** instead of a `503` database timeout error.
2. **Secondary Root Cause: Header-Only Auth Parsing (Ignores the HttpOnly `token` Cookie)**
   - Unlike older admin endpoints that use `getTokenFromRequest(request)` (`lib/jwt.ts`) to read the HttpOnly `token` cookie first, `classrooms/route.ts` (and 11 other routes) **only** reads the `Authorization` header (`request.headers.get("authorization")?.replace("Bearer ", "")`).
   - Because `lib/store.ts:45-49` intentionally does **not** persist `token` in `localStorage` (`partialize` omits `token`), if the in-memory `token` is `null`/empty (e.g., after a reload or race condition), the frontend sends `Authorization: Bearer `. HTTP trims the trailing space to `"Bearer"`, `"Bearer".replace("Bearer ", "")` yields `"Bearer"` (truthy!), bypassing the `401` check and failing inside `getCurrentUser("Bearer") -> null` -> **`403 Forbidden`**.
3. **Tertiary Factor: `AdminLayout` vs. `AuthSessionBootstrap` Hydration Race**
   - On a hard page reload on `/admin/*`, `useAuthStore` rehydrates `user` and `hydrated: true` while `token` starts as `null`. `app/admin/layout.tsx:48-58` checks `if (!token)` immediately before `components/auth/auth-session-bootstrap.tsx` finishes restoring `token` from `/api/auth/me` via the HttpOnly cookie.

---

## 2. Live Environment & Database Verification

A read-only scan of `.env.local` and the Neon PostgreSQL `users` table confirmed:

| Check | Verified Value |
| :--- | :--- |
| Active Database Backend | `DATABASE_BACKEND=postgres` (Neon PostgreSQL) |
| Configured Env Admin Email (`ADMIN_ACCOUNTS_EMAIL`) | `spacecontactme0@gmail.com` |
| Configured Env Admin Password (`ADMIN_ACCOUNTS_PASSWORD`) | Configured (set) |
| Legacy Bootstrap Vars (`BOOTSTRAP_ADMIN_EMAIL` / `_PASSWORD`) | Unset |
| DB Record for `spacecontactme0@gmail.com` | `id: 71b2f885-9dca-42fb-92c3-c4691e2d36f0` |
| DB Role / Status / Email Verification | `role: 'admin'`, `status: 'active'`, `email_verified: true` |
| Other DB Accounts | 2 `student` accounts, 2 `instructor` accounts |
| `authService.getCurrentUser(validAdminToken)` | Verified returns `{ role: 'admin' }` when Neon responds within 5s |

### RBAC Permissions Granted to the `admin` Role (`lib/authorization.ts:23-28`)
The `admin` role automatically holds all 14 permissions in the platform:
- `admin:read`, `admin:manage`
- `course:create`, `course:update`, `course:publish`, `course:approve`, `course:delete`
- `student:read`, `student:update`
- `instructor:read`, `instructor:update`
- `payment:read`, `payment:verify`
- `certificate:create`

---

## 3. How Admin Authorization Works End-to-End

1. **Login (`app/(auth)/login/page.tsx` -> `POST /api/auth/login` -> `lib/auth.ts:110-152`)**
   - Submitting `ADMIN_ACCOUNTS_EMAIL` + `ADMIN_ACCOUNTS_PASSWORD` hits `authService.login()`.
   - `authService.login()` matches the env admin credentials, ensures the PostgreSQL user row has `role: "admin"`, `status: "active"`, and `emailVerified: true`, and signs a JWT (`{ userId, email, role: "admin" }`) using `JWT_SECRET` (`JWT_EXPIRES_IN=7d`).
   - `app/api/auth/login/route.ts:9-19` sets an **HttpOnly cookie** named `token` and also returns `{ user, token }` in JSON.
   - `login/page.tsx:152` stores `{ user, token }` in memory via `useAuthStore.setAuth(result.user, result.token)`.
2. **Route Protection (`proxy.ts` + `app/admin/layout.tsx`)**
   - `proxy.ts:51-58` validates the HttpOnly `token` cookie on server requests to `/admin/*`.
   - `app/admin/layout.tsx:45-94` calls `GET /api/auth/me` with `Authorization: Bearer ${token}` and requires `currentUser.role === "admin"`.
3. **API Authorization (`app/api/**`)**
   - **Cookie + Bearer routes** use `getTokenFromRequest(request)` (`lib/jwt.ts:4-19`) or `getCurrentUserFromRequest(request)` (`lib/authorization.ts:30-37`), checking the HttpOnly `token` cookie first and falling back to the `Authorization: Bearer` header.
   - **Header-only routes** (including `POST /api/campuses/[campusId]/classrooms`) ignore the cookie and require a valid `Authorization: Bearer <jwt>` header **plus** a successful Neon DB lookup in `authService.getCurrentUser(token)`.

---

## 4. How to Gain & Use Admin Authorization Right Now (No Code Changes Required)

Follow these steps to perform admin tasks (such as creating classrooms, cohorts, sessions, categories, or viewing installments) immediately:

### Step 1: Log in with the Admin Account
- Navigate to `http://localhost:3000/login` (or `/login-admin`, which redirects to `/login`).
- Sign in using the credentials defined in `.env.local`:
  - **Email:** `spacecontactme0@gmail.com` (`ADMIN_ACCOUNTS_EMAIL`)
  - **Password:** the value of `ADMIN_ACCOUNTS_PASSWORD` in `.env.local`
- Verify the left sidebar of `/admin` displays **Admin Account — Admin** (not Student, Instructor, or Finance).

### Step 2: Keep the In-Memory Token Populated
- After logging in, navigate to **Campuses & Labs** (`/admin/campuses`) using the **left sidebar link** (client-side navigation) rather than hard-reloading the page.
- If you hard-refreshed `/admin/campuses` or opened it in a brand-new tab, visit `http://localhost:3000/login` once (or sign out and sign back in) so `useAuthStore` populates the in-memory `token` before submitting mutations.

### Step 3: Handle Neon Cold-Start 5-Second Timeouts (If You See `403` After ~5s)
- Look at your Next.js server terminal output:
  - If the log shows `403` with **`render: 5.0s`** (like `POST /api/campuses/.../classrooms 403 in 17.2s (compile: 12.2s, proxy.ts: 13ms, render: 5.0s)`), Neon PostgreSQL took slightly over 5 seconds to wake up and `getCurrentUser` swallowed the timeout.
  - **Action:** Simply click **"Create Classroom"** (or submit the form) **a second time immediately** while the Neon database connection is warm. The second request will complete in <500ms with `201 Created`.

### Step 4: Verify Your Request Header in Browser DevTools (Troubleshooting)
If a request still returns `403`:
1. Open Chrome DevTools (`F12`) -> **Network** tab.
2. Click the failed `POST /api/campuses/.../classrooms` request -> **Headers** -> **Request Headers**.
3. Check the `Authorization` header:
   - **Good:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...` (a full 3-part JWT). If this is present and the response took ~5.0s, it was a Neon DB timeout — retry immediately.
   - **Bad:** `Authorization: Bearer` (empty after `Bearer`) or `Authorization: Bearer null`. This means the in-memory token was empty — log out and log back in at `/login`.

### Step 5: Creating Additional Authorized Admin Accounts
Once signed into `/admin` as `spacecontactme0@gmail.com`:
- Click **Create Admin/Finance** on `/admin` (calls `POST /api/admin/create-user`).
- Choose role **`admin`** (full admin console authority) or **`finance`** (read-only admin/payment verification).
- Any account created with role `admin` receives the exact same full admin permissions across all admin routes.

### Direct API / `curl` Usage (If Testing Outside the Browser)
If calling admin endpoints via `curl`, Postman, or scripts:
1. Obtain a JWT by posting to `/api/auth/login` with your admin email and password, and read `token` from the JSON response.
2. Pass it in the header:
   ```bash
   Authorization: Bearer <your_admin_jwt_token>
   ```

---

## 5. Complete Scan Inventory of Affected API Routes

The following routes currently use **Header-Only** token parsing (`request.headers.get("authorization")?.replace("Bearer ", "")`) instead of `getTokenFromRequest(request)`, making them vulnerable to both the empty-`"Bearer"` `403` bug and missing cookie fallback, as well as the `getCurrentUser` 5s timeout `403` false-positive:

| Route File | HTTP Methods Affected | Current Role Check |
| :--- | :--- | :--- |
| `app/api/campuses/[campusId]/classrooms/route.ts` | `POST` | `admin` only |
| `app/api/campuses/route.ts` | `POST` | `admin` only |
| `app/api/cohorts/route.ts` | `POST` | `admin` only |
| `app/api/sessions/route.ts` | `POST` | `admin` or `instructor` |
| `app/api/sessions/[sessionId]/attendance/route.ts` | `GET`, `POST` | `admin` or `instructor` |
| `app/api/sessions/[sessionId]/book/route.ts` | `POST`, `DELETE` | any authenticated user |
| `app/api/admin/installments/route.ts` | `GET`, `POST` | `admin` only |
| `app/api/categories/route.ts` | `POST` | `admin` or `instructor` |
| `app/api/categories/[id]/route.ts` | `PUT`, `DELETE` | `admin` or `instructor` |
| `app/api/certificates/issue/route.ts` | `POST` | any authenticated user |
| `app/api/courses/[id]/lessons/[lessonId]/approve/route.ts` | `POST` | `admin` only |
| `app/api/courses/[id]/lessons/[lessonId]/reject/route.ts` | `POST` | `admin` only |

By contrast, these admin routes **already** use `getTokenFromRequest(request)` / `getCurrentUserFromRequest(request)` (reading the HttpOnly `token` cookie first):
- `app/api/admin/create-user/route.ts`
- `app/api/admin/logs/route.ts`
- `app/api/admin/payments/verify/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/users/route.ts`, `app/api/users/[id]/route.ts`
- `app/api/courses/route.ts` (`POST`), `app/api/courses/[id]/route.ts` (`PUT`)
- `app/api/payments/route.ts`, `app/api/payments/verify/route.ts`
- `app/api/campaign/route.ts`, `app/api/onsite-training/route.ts`

---

## 6. Implemented Permanent Fixes

All four permanent fixes have been applied and verified:

1. **[x] Increased Neon Connection Timeout (`db/client.ts:42`)**:
   - Raised `connectionTimeoutMillis` from `5000` to `Number(process.env.PG_CONNECTION_TIMEOUT_MS || 20000)` to accommodate Neon serverless cold starts without dropping requests.
2. **[x] Stopped Swallowing DB Errors in `authService.getCurrentUser` (`lib/auth.ts:600-618`) & `/api/auth/me` (`app/api/auth/me/route.ts`)**:
   - `getCurrentUser` now returns `null` only when JWT verification fails (`!decoded`) or the user record does not exist (`!user`). Database/network errors propagate properly, and `/api/auth/me` returns `503 Service Unavailable` instead of `401 Unauthorized` on transient DB failures.
3. **[x] Standardized Token Extraction Across All 15 Routes + Hardened `lib/jwt.ts`**:
   - Hardened `getTokenFromRequest(request)` (`lib/jwt.ts`) to reject empty, whitespace-only, `"Bearer"`, `"null"`, and `"undefined"` token values while preferring the HttpOnly `token` cookie and falling back to `Authorization: Bearer <jwt>`.
   - Migrated all 12 header-only routes plus the 3 course routes (`app/api/courses/route.ts`, `app/api/courses/[id]/route.ts`, `app/api/courses/slug/[slug]/route.ts`) to `getTokenFromRequest(request)`, separating `401 Unauthorized` (`!token` / `!user`) from `403 Forbidden` (`user.role !== "admin"`).
4. **[x] Eliminated Reload Race in `app/admin/layout.tsx` & Added Cookie Credentials on Admin Pages**:
   - Updated `app/admin/layout.tsx` to verify via `GET /api/auth/me` with `credentials: "include"` even when the in-memory `token` is `null` after a reload, preserving the current redirect pathname and avoiding false logouts on transient `503` responses.
   - Updated `app/admin/campuses/page.tsx`, `app/admin/cohorts/page.tsx`, and `app/admin/payments/installments/page.tsx` to send `credentials: "include"` and only include `Authorization` when `token` is non-empty.
