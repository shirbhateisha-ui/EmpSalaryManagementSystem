# Trade-off Explanations

> Key decisions made during the build, the alternatives considered, and the
> reasoning behind each choice. Complements [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. SQLite over PostgreSQL

**Choice:** `better-sqlite3` (synchronous SQLite driver)

**Alternatives considered:** PostgreSQL via `pg` or `node-postgres`, Turso/libSQL

**Why SQLite:**
- Zero-ops: ships as a single file, no server process to run or configure.
- `better-sqlite3` is synchronous — no callback or Promise overhead; queries return
  directly, which simplifies service and repository code.
- `:memory:` databases make test isolation trivial (create a fresh DB per test file,
  no teardown needed).
- WAL mode enables concurrent readers with a single writer — sufficient for this
  workload.
- At 10,000 employees with analytics aggregations, SQLite easily stays under 10 ms
  per query.

**What we give up:**
- No connection pooling or horizontal read replicas.
- No `RETURNING` clause (SQLite added it in 3.35 — `better-sqlite3` supports it, but
  compatibility was avoided; repos re-fetch after insert instead).
- Deployment requires a persistent disk (Render, Fly.io) — ephemeral filesystems
  wipe the database on redeploy. This is the top deployment risk.

**Migration path:** Swapping to PostgreSQL requires changing the driver import,
adjusting `CURRENT_TIMESTAMP` → `NOW()`, and adding connection pooling. SQL
otherwise stays the same.

---

## 2. JWT Access Tokens + Rotating Refresh Tokens over Simple Sessions

**Choice:** Short-lived JWT (15 min) in Redux memory + long-lived refresh token
in an `httpOnly` cookie with server-side rotation and revocation.

**Alternatives considered:** Server-side sessions (express-session + SQLite store),
single long-lived JWT stored in localStorage.

**Why this approach:**
- **No localStorage for credentials.** `httpOnly` cookies are invisible to
  JavaScript; XSS cannot steal the refresh token. The access token lives in Redux
  memory and is lost on page close.
- **Short access token TTL** limits the damage window if a token is intercepted —
  it expires in 15 minutes with no way to extend it.
- **Rotation** means every refresh call issues a new refresh token and revokes the
  old one. If a token is stolen and used, the legitimate client's next refresh fails,
  immediately revealing the reuse.
- **Revocable** on logout: the server marks the token hash as revoked; no need to
  wait for expiry.

**What we give up:**
- More moving parts than a simple session cookie.
- Requires a `refresh_tokens` table and hash lookups on every refresh.
- The access token cannot be invalidated before its 15-minute TTL — a deactivated
  user retains API access until their current token expires.

---

## 3. Hand-Written SQL in Repositories over an ORM

**Choice:** Parameterised SQL strings in repository classes, returning typed rows.

**Alternatives considered:** Drizzle ORM, Prisma, Knex query builder.

**Why raw SQL:**
- Demonstrates fundamentals clearly — every query is readable and auditable.
- Full control over the `v_current_salary` view join, `CASE WHEN` distribution
  bucketing, and `COALESCE` guards for empty databases.
- No ORM migration layer to configure alongside the custom SQL migration runner.
- SQLite + `better-sqlite3` has excellent TypeScript support without needing an ORM
  layer.

**What we give up:**
- More boilerplate per query (no schema-driven auto-completion).
- Refactoring column names requires grep + manual update rather than a type-checked
  schema change.
- No ORM-provided soft-delete or timestamp auto-management.

---

## 4. Append-Only Salary History over a Single `current_salary` Column

**Choice:** `salaries` table with one row per raise event; current salary derived
via `v_current_salary` view.

**Alternatives considered:** Storing `current_salary_usd` directly on the
`employees` row (denormalised), updating in-place on raise.

**Why append-only:**
- Every raise is a business event with an `effective_date`. Overwriting loses that
  history permanently.
- Full audit trail at no extra cost — HR can see what any employee earned at any
  point in time.
- No UPDATE/DELETE routes are needed or exposed, reducing attack surface.

**What we give up:**
- Sorting employees by salary requires joining through the view, which adds a
  correlated subquery. At 10,000 rows this is fast; at 1M+ rows an indexed
  `current_salary_usd` column on `employees` would be the fallback.
- Slightly more complex queries for simple "show me everyone's salary" listings.

---

## 5. CSS Bar Charts over a Chart Library

**Choice:** Pure CSS `div` bars with inline `width` percentage. No external chart
library.

**Alternatives considered:** Recharts, Chart.js, Nivo, Visx.

**Why CSS charts:**
- Zero bundle cost — no extra dependency, no tree-shaking concern.
- Simple horizontal bars fit the use case perfectly. Each bar is:
  ```tsx
  <div style={{ width: `${Math.max((value / max) * 100, 2)}%` }} />
  ```
- No licensing friction for an assessment project.
- Renders correctly in jsdom without needing canvas mocks.

**What we give up:**
- No animated transitions, interactive tooltips, or accessible `<title>` SVG labels
  that a real chart library provides out of the box.
- Custom hover states require additional CSS; axis labels need manual layout.
- Not appropriate for complex chart types (line, scatter, pie) — would add Recharts
  or Nivo for those.

---

## 6. RTK Query over React Query / SWR

**Choice:** RTK Query (part of Redux Toolkit) for all server state.

**Alternatives considered:** TanStack Query (React Query), SWR.

**Why RTK Query:**
- The project already uses Redux Toolkit for the `authSlice` (access token, user,
  auth status). Adding RTK Query keeps everything in one store — no second state
  manager.
- `baseQuery` with re-authentication logic (refresh-on-401) is a first-class pattern
  in RTK Query.
- Automatic cache invalidation via tag-based invalidation when mutations succeed.
- Generated hooks (`useGetEmployeesQuery`, `useAddSalaryMutation`) have identical
  call signatures, keeping components consistent.

**What we give up:**
- RTK Query is heavier than React Query if Redux isn't already in the project.
- More boilerplate: `reducerPath`, `middleware` wiring, `createApi` setup.
- Slightly harder to tree-shake than a standalone React Query setup.

---

## 7. `vi.mock()` on RTK Query Hooks over MSW

**Choice:** Mock RTK Query hooks directly with `vi.mock('@/features/.../api')` in
every component test.

**Alternatives considered:** Mock Service Worker (MSW) at the network layer.

**Why direct mocks:**
- MSW requires a Service Worker setup in the browser and a separate handler file
  tree. This is non-trivial in a jsdom test environment.
- Each page component consumes 1–5 RTK Query hooks. Mocking the hook directly is
  3–4 lines per test and fully controls the `{ isLoading, isError, data }` shape.
- Tests run faster — no network interception layer.
- Isolation is cleaner: component tests don't accidentally test RTK Query internals.

**What we give up:**
- Tests don't exercise the RTK Query cache, normalisation, or serialisation layers.
- Request/response shape mismatches between the real API and the mock won't be
  caught at the component layer (covered instead by backend integration tests).

---

## 8. `fireEvent` + `vi.useFakeTimers()` over `userEvent` for Debounce Tests

**Choice:** `fireEvent.change()` combined with `vi.useFakeTimers()` and
`act(() => vi.advanceTimersByTime(350))`.

**Alternatives considered:** `userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })`

**Why `fireEvent`:**
- `userEvent.setup` with `advanceTimers` triggers async pointer-event simulation
  that interacts badly with jsdom's fake timer implementation, causing 5,000 ms
  timeouts.
- `fireEvent.change()` is synchronous. Paired with fake timers and `act()`, debounce
  tests complete in milliseconds.
- The debounce test only needs to verify that the search value reaches the query
  hook after the delay — it does not need full keyboard simulation.

**What we give up:**
- `fireEvent` does not simulate the full browser event sequence (`focus`, `keydown`,
  `input`, `keyup`). Bugs that depend on that sequence won't be caught here.

---

## 9. Feature-Based Frontend Structure over Layer-Based

**Choice:** `features/auth`, `features/employees`, `features/analytics` — each
containing its own `api/`, `components/`, `pages/`, `types/`.

**Alternatives considered:** Layer-based: top-level `pages/`, `components/`,
`services/`, `types/` directories shared across features.

**Why feature-based:**
- Code that changes together lives together. Adding a new employees filter touches
  `features/employees/` only — no hunting across four top-level directories.
- Feature folders can be extracted into separate packages or micro-frontends if the
  app grows.
- Easier for a new developer to understand the scope of a feature.

**What we give up:**
- Shared primitives (Shadcn components, layout) still live at a top level and must
  be treated carefully to avoid feature-specific logic leaking in.
- Slightly more nesting than a flat structure.
