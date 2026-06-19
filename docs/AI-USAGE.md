# AI Usage

> How Claude Code (AI) was used during this project, what was prompted, what was
> verified manually, and the guardrails applied. There is **no AI/LLM inside the
> running application** — all payroll questions are answered by deterministic SQL.

---

## Role of AI in This Project

Claude Code was used as a **development accelerator** across all phases. It did not
design the system — the architecture, schema, and API contract were decided upfront
in [ARCHITECTURE.md](./ARCHITECTURE.md) and [REQUIREMENTS.md](./REQUIREMENTS.md).
AI was then used to implement those decisions quickly while the developer reviewed,
corrected, and guided each step.

---

## How the Workflow Operated

Each phase followed this loop:

```
1. Developer states the phase goal and any constraints
2. Claude reads the relevant phase doc + existing code
3. Claude implements the files
4. Developer reviews the code and runs the tests
5. Developer flags any failures or disagreements
6. Claude fixes them
7. Developer marks the phase complete and requests a commit message
```

The developer retained final authority over every commit. Claude was explicitly
instructed never to commit or push without an explicit request.

---

## Representative Prompts by Phase

### Foundation & scaffold (Phases 0–1)
```
Set up an npm workspaces monorepo with a backend (Node/Express/TypeScript)
and a frontend (Vite/React/TypeScript). Backend uses better-sqlite3.
Frontend uses Tailwind CSS 3 and Shadcn UI.
```

```
Create the SQLite schema for employees, salaries, currencies, users, and
refresh_tokens. Add a v_current_salary view that selects the latest salary
per employee and computes base_salary_usd = base_salary * rate_to_usd.
Enable WAL mode and foreign keys. Add a seed script for 10,000 employees
using @faker-js/faker.
```

### Backend auth (Phase 2)
```
Implement JWT authentication with rotating refresh tokens stored as an
httpOnly cookie. Access tokens expire in 15 minutes. Refresh tokens expire
in 7 days and are stored hashed in refresh_tokens. Rotating means: on each
/auth/refresh call, revoke the current token and issue a new one. Implement
reuse detection (revoked token used again → revoke the session). Add an
authenticate middleware and an authorize(...roles) middleware for RBAC with
three roles: ADMIN, HR_MANAGER, VIEWER.
```

### Backend modules (Phases 5–7)
```
Implement the employees module following Route → Controller → Service →
Repository. The repository uses hand-written parameterised SQL only.
The service must guard against duplicate emails (ConflictError) and missing
employees (NotFoundError). The list endpoint supports search (LIKE prefix on
name), filter by country/department/status, sort by name/salary/joining_date,
and pagination. Join through v_current_salary to include the current salary
in each employee row.
```

```
Implement the analytics module. All queries must join through v_current_salary
and filter to active employees only. Endpoints: summary (total/avg/min/max
annual USD, total monthly USD, headcount), by-country, by-department,
distribution (6 fixed salary bands using CASE WHEN in SQL, always return all
6 bands even if headcount is 0), top-earners (top N by base_salary_usd).
```

### Frontend components (Phases 3–4, 8–9)
```
Implement the AppShell with a collapsible sidebar. The sidebar nav items come
from a navigation config. Use Shadcn UI Card, Button, Table primitives.
Set up RTK Query with a baseQuery that attaches the Authorization header from
the Redux auth slice. On 401, silently call POST /auth/refresh, update the
access token in the store, and retry the original request once.
```

```
Implement AnalyticsPage. Use RTK Query hooks for all 5 analytics endpoints.
Build KPI cards showing headcount, annual payroll, monthly payroll, average,
highest, and lowest salary. Build horizontal bar charts using pure CSS (no
chart library) — bar width = (value / max) * 100%, min 2%. Build an insights
panel with 5 preset accordion questions backed by the live API data.
Handle loading, error, empty (headcount = 0), and data states.
```

### Tests
```
Write Vitest tests for the analytics repository. Include a test that seeds
an employee with a EUR salary using a currency with rate_to_usd = 1.1 and
verifies that base_salary_usd in the summary is correctly converted.
```

```
Write RTL tests for EmployeesPage. Mock the RTK Query hook with vi.mock().
Test all four states: loading, error, empty, data. Test that search is
debounced: type a value, advance fake timers by 350ms, and assert the query
received the search value only once. Use fireEvent.change (not userEvent)
with vi.useFakeTimers() to avoid timeout issues in jsdom.
```

---

## Constraints Given to the AI

These instructions were maintained throughout all phases:

- **Never commit or push without explicit request.** Only create a branch and
  provide commit message text when asked.
- **After each phase: mark all tasks `[x]` in the phase doc and verify tests pass**
  before reporting the phase complete.
- **No extra features or abstractions.** Implement exactly what the phase doc
  describes — no premature generalisation.
- **No chart library.** CSS-only bar charts.
- **No MSW.** Mock RTK Query hooks directly with `vi.mock()`.
- **No `userEvent` for debounce tests.** Use `fireEvent` + `vi.useFakeTimers()`.
- **Zod v4 syntax.** (Not Zod v3 — `.string().min()` not `.string().nonempty()`.)
- **Response envelope on every route.** `{ success, data }` or `{ success, error }`.
- **Append-only salaries.** No UPDATE or DELETE routes on the salaries table.

---

## What Was Verified Manually

Every AI-generated file was reviewed and, where applicable, run before being
accepted. Specific manual checks:

| Area | What was checked |
|------|-----------------|
| SQL queries | Ran against the seed database; compared totals to hand-computed values |
| Currency normalisation | Verified `base_salary * rate_to_usd` produces correct USD totals with a known fixture |
| Auth middleware chain | Tested 401 (no token), 403 (wrong role), 422 (bad body) via Postman before writing automated tests |
| Refresh token rotation | Manually verified that re-using a revoked refresh token returns 401 |
| v_current_salary view | Verified that adding a second salary record for an employee updates the view's result |
| Test failures | All test failures were read and diagnosed before fixing — Claude was not permitted to blindly retry |
| Response envelope | Checked that every route returns `{ success, data }` or `{ success, error }` with the correct HTTP status |

---

## Corrections Made During Build

Several AI outputs required correction:

| Issue | Fix |
|-------|-----|
| `cs.id AS salary_id` in employee repository — the view already aliases `s.id AS salary_id`, so the SELECT must use `cs.salary_id` | Fixed the SELECT to use the correct alias from the view |
| `employee.controller.ts` imported from `'../../shared/utils/response.js'` (wrong filename) | Corrected to `response.utils.js` |
| Debounce tests timed out at 5,000 ms when using `userEvent.setup({ advanceTimers })` | Switched to `fireEvent.change()` + `vi.useFakeTimers()` |
| Analytics test regex `/distribution across bands/i` did not match "How are salaries **distributed** across bands?" | Changed regex to `/salaries distributed across bands/i` |
| `getByText` failing with "found multiple elements" for text appearing in both a chart and a table | Changed to `getAllByText(...)[0]` or `getAllByText(...).length > 0` assertions |

---

## What AI Did Not Do

- **Did not design the system.** The schema, API contract, folder structure, and
  phase breakdown were decided by the developer and documented before implementation
  began.
- **Did not make commit decisions.** Every commit was explicitly requested with the
  exact message reviewed before use.
- **Did not run in production.** There is no AI component in the deployed app. The
  insights panel answers questions using SQL aggregations, not an LLM.
- **Did not skip tests.** Every phase required tests to pass before being marked
  complete; AI was not allowed to mark a phase done if tests were failing.
