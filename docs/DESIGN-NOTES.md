# Design Notes

> Implementation-level decisions, flow diagrams, and rationale captured during
> build. Complements [ARCHITECTURE.md](./ARCHITECTURE.md) (system-level) and
> [REQUIREMENTS.md](./REQUIREMENTS.md) (scope).

---

## Authentication Flow

### Token lifecycle

```
Browser                        Express                       SQLite
  │
  │── POST /auth/login ───────▶ validate body (Zod)
  │                             SELECT user WHERE email = ?
  │                             bcrypt.compare(password, hash)
  │                             sign accessToken (JWT, 15 min)
  │                             sign refreshToken (opaque, 7 d)
  │                             INSERT refresh_tokens (token_hash)
  │◀── { accessToken } ────────
  │◀── Set-Cookie: refresh=... (httpOnly, secure, sameSite=strict)
  │
  │── GET /employees ─────────▶ authenticate middleware
  │   Authorization: Bearer    jwt.verify(accessToken, secret)
  │                             attach req.user = { id, role, … }
  │                             authorize('ADMIN','HR_MANAGER')
  │                             → controller → service → repo
  │◀── { success, data } ──────
  │
  │── POST /auth/refresh ──────▶ read cookie (refresh token)
  │                              SELECT WHERE token_hash = hash(cookie)
  │                              check not revoked, not expired
  │                              UPDATE SET revoked_at = now()   ← rotate
  │                              INSERT new refresh_tokens row
  │                              sign new accessToken
  │◀── { accessToken } ─────────
  │◀── Set-Cookie: refresh=... (new cookie)
  │
  │── POST /auth/logout ───────▶ UPDATE refresh_tokens SET revoked_at
  │                              clearCookie('refresh')
  │◀── { success: true }
```

**Why rotation on every refresh?** If a refresh token is stolen and used by an
attacker, the legitimate client's next refresh will hit a revoked token. The server
can detect the reuse (a still-valid token was revoked before expiry) and revoke the
entire session.

**Why httpOnly cookie for the refresh token?** JavaScript cannot read httpOnly
cookies. XSS cannot steal the long-lived credential. The short-lived access token
lives in Redux memory (not `localStorage`) for the same reason.

### Client-side session restore

On app boot the frontend calls `GET /auth/me` using whatever access token is in
Redux. If the token is missing or expired (401), it silently calls
`POST /auth/refresh` using the cookie. If refresh also fails, the user is sent to
`/login`. This means a page refresh never logs the user out as long as the refresh
token is valid.

---

## Salary Data Model

### Why append-only?

A salary raise is a business *event*, not a mutation. The `salaries` table records
every change with an `effective_date`. The most recent row is the "current salary".
This gives:

- Full audit trail at zero extra cost.
- Easy "salary as of date X" queries.
- No UPDATE/DELETE routes exposed — the history cannot be tampered with through the API.

### `v_current_salary` view

```sql
CREATE VIEW v_current_salary AS
SELECT
  e.id   AS employee_id,
  s.id   AS salary_id,
  s.base_salary,
  s.currency_code,
  s.country,
  s.effective_date,
  s.base_salary * c.rate_to_usd AS base_salary_usd
FROM employees e
INNER JOIN salaries s ON s.id = (
  SELECT id FROM salaries
  WHERE employee_id = e.id
  ORDER BY effective_date DESC, id DESC
  LIMIT 1
)
INNER JOIN currencies c ON c.code = s.currency_code;
```

The subquery selects the latest salary per employee (ties broken by id).
`base_salary_usd` is computed once in the view and consumed by every analytics
query — no duplication, no inconsistency.

### Currency normalisation

All amounts stored as-recorded (local currency). Conversion to USD happens at
query time via `base_salary * rate_to_usd`. This means:

- Updating an exchange rate immediately affects all analytics.
- Historical salary records remain accurate in their original currency.
- No storing of derived USD amounts that could drift out of sync.

### Annual vs monthly

Salaries are stored as **annual gross**. Monthly spend is always `annual / 12`.
This is the canonical unit; the summary endpoint surfaces both. Storing monthly
would risk factor-of-12 errors in aggregations.

---

## Phase Delivery Sequence

The project was built phase-by-phase, backend before frontend for each domain, so
every frontend feature had a real API to connect to.

```
Phase 0  Monorepo + TypeScript + lint + env config
Phase 1  Database schema, migrations, v_current_salary view, seed (10k employees)
Phase 2  Backend auth + RBAC (login, refresh rotation, middleware, user management)
Phase 3  Frontend shell (AppShell, Sidebar, RTK Query base, health check)
Phase 4  Frontend auth (login page, auth slice, AuthGuard, RoleGuard, user menu)
Phase 5  Backend employees (CRUD, search/filter/sort/paginate, v_current_salary join)
Phase 6  Backend salaries (append-only history, add raise)
Phase 7  Backend analytics (summary, by-country, by-department, distribution, top-earners)
Phase 8  Frontend employees (list table, detail page, salary history, add raise)
Phase 9  Frontend analytics (KPI cards, CSS bar charts, insights panel)
```

---

## Response Envelope

Every API response uses one of two shapes. No exceptions.

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 243, "totalPages": 25 }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "base_salary", "message": "Expected number" }]
  }
}
```

`meta` is optional and only present on paginated list responses. The `code` field
is a machine-readable string the frontend can switch on without parsing the message.

---

## Error Hierarchy

```
AppError (base — HTTP status + code + message)
├── ValidationError   (422 — Zod parse failures)
├── NotFoundError     (404 — resource does not exist)
├── ConflictError     (409 — duplicate email, etc.)
├── UnauthorizedError (401 — missing or invalid token)
└── ForbiddenError    (403 — authenticated but wrong role)
```

Any layer can throw these. The `errorHandler` middleware at the Express level
catches them, maps to the correct HTTP status, and formats the envelope. Unexpected
errors fall through to a 500 with a generic message (no stack traces in production).

---

## Frontend State Ownership

| State type              | Owner                        | Reason                                              |
|-------------------------|------------------------------|-----------------------------------------------------|
| Auth (token + user)     | Redux slice (`authSlice`)    | Needed globally by the RTK Query baseQuery          |
| Server data (employees, analytics, etc.) | RTK Query cache | Handles loading/error/stale automatically     |
| Filter / search / pagination | Local `useState` in page component | Simple, co-located, no cross-feature sharing |
| UI (open modal, etc.)   | Local `useState`             | Not needed outside the component                    |

Filters are intentionally kept in local state rather than a Redux slice. They
reset naturally when the user navigates away, which matches the expected UX.

---

## Test Strategy (as implemented)

### Backend
- **Repository tests** — real `:memory:` SQLite, seeded fixtures, verify SQL
  correctness including the `v_current_salary` view and cross-currency aggregations.
- **Service tests** — mocked repository; test business rules in isolation
  (distribution bucketing, monthly = annual / 12, error paths).
- **Route/integration tests** — Supertest against the full Express app with a
  test database; verify middleware chain (401/403/422), happy paths, response
  envelope shape.

### Frontend
- **Component tests** — Vitest + React Testing Library; `vi.mock()` on RTK Query
  hooks; test all four states (loading / error / empty / data) per page.
- **Debounce tests** — `vi.useFakeTimers()` + `fireEvent.change()` (not
  `userEvent` — causes timeouts with fake timers in jsdom).
- **Slice tests** — plain unit tests on Redux reducers and selectors.
- No MSW — hook-level mocking is sufficient for component isolation at this scale.
