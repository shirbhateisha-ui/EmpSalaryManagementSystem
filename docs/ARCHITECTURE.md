# ACME Salary Management — Architecture & Execution Plan

> Companion to [REQUIREMENTS.md](./REQUIREMENTS.md). Covers the architecture
> principles, system/database/API design, testing, deployment, AI usage, risks, and
> the phase-wise execution + git commit plan.
>
> **Status: design approved-pending. No implementation has started.**

---

## 1. Architecture Principles & Decisions

The system is built on a small set of deliberate principles that keep it clean,
testable, and maintainable at a scale of ~10,000 employees.

### Backend principles

| Principle | Decision |
|---|---|
| **Strict layering** | `Route → Controller → Service → Repository → SQLite`. Each layer has one responsibility; dependencies point inward only. |
| **Module-per-domain** | Each domain (`employees/`, `salaries/`, `analytics/`) owns its controller, routes, service, repository, validation, and types. Clear boundaries, easy to navigate. |
| **Repository pattern** | All SQL lives in repositories returning typed rows. Keeps services pure and lets us test data access against in-memory SQLite. |
| **Consistent response envelope** | Every response is `{success, data, meta?}` or `{success, error:{code, message, details?}}`. One predictable contract for the client. |
| **Centralized error handling** | A custom error hierarchy (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`) thrown anywhere, caught by one `errorHandler` middleware that maps to status codes + envelope. |
| **Validation at the edge** | A `validate(zodSchema)` middleware checks body/query/params before handlers run, returning `422` with field-level details. Zod schemas double as request types. |
| **Reusable pagination** | A shared pagination utility returns `{page, limit, total, totalPages, hasNext, hasPrev}` — directly serving fast listing over 10k rows. |
| **Validated configuration** | Environment is parsed/validated with Zod at boot (`config/env.ts`); the app fails fast on misconfiguration. |

### Frontend principles

| Principle | Decision |
|---|---|
| **Feature-based structure** | Each feature (`employees`, `salaries`, `analytics`) co-locates its `api/`, `components/`, `pages/`, and `types/`. Code that changes together lives together. |
| **RTK Query for server state** | A shared `baseQuery` + per-feature API slices handle fetching, caching, and the loading/error states; Redux Toolkit holds only UI state (filters, pagination). |
| **Shared layer for cross-cutting** | Layout, Shadcn UI primitives, hooks, and common types live in shared locations to prevent duplication. |
| **Explicit UI states** | Every data view renders distinct loading / empty / error / data states. |

---

## 2. System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend — React + Vite (Vercel)"]
        UI["Pages / Feature Components<br/>(Shadcn UI + Tailwind)"]
        RTKQ["RTK Query API slices<br/>(employeesApi, analyticsApi)"]
        Store["Redux Toolkit store<br/>(UI state: filters, pagination)"]
        UI --> Store
        UI --> RTKQ
    end

    subgraph Server["Backend — Node + Express + TS (Render)"]
        direction TB
        MW["Middleware<br/>cors · helmet · rateLimiter · validate(zod) · errorHandler"]
        Routes["Routes (/employees, /salaries, /analytics)"]
        Ctrl["Controllers — HTTP in/out only"]
        Svc["Services — business logic, currency normalization"]
        Repo["Repositories — parameterized SQL"]
        DB[("SQLite<br/>better-sqlite3<br/>persistent disk")]
        MW --> Routes --> Ctrl --> Svc --> Repo --> DB
    end

    RTKQ -- "HTTPS JSON<br/>{success,data,meta}" --> MW

    subgraph Cross["Cross-cutting"]
        Err["AppError hierarchy"]
        Resp["Response envelope util"]
        Pag["Pagination util"]
    end
    Svc -.throws.-> Err
    Ctrl -.formats.-> Resp
    Repo -.uses.-> Pag
```

**Layer responsibilities (clean architecture):**

- **Controller** — parse validated request, call service, format response via the
  envelope util. No business logic, no SQL.
- **Service** — business rules: currency conversion, "current salary = latest
  effective record", distribution bucketing, orchestration. Unit-testable with a
  mocked repository.
- **Repository** — the only place that writes SQL; returns typed rows. Tested against
  in-memory SQLite.
- **Validator (Zod)** — request schemas + the `validate` middleware; single source of
  truth for request types.

**Key decisions & tradeoffs**

| Decision | Choice | Tradeoff |
|---|---|---|
| SQLite driver | **`better-sqlite3`** (synchronous) | Simpler, faster for 10k rows, trivial `:memory:` tests. Loses async I/O — irrelevant at this scale/single node. |
| Data access | **Hand-written SQL in repositories** (Drizzle noted as alternative) | Shows fundamentals + full control over aggregations; more boilerplate than an ORM. |
| Cross-currency totals | **Normalize to USD via `currencies.rate_to_usd`** at query time | Makes "total payroll" meaningful. Rates seeded/static (live FX out of scope). |
| Current salary | **`salaries` history table + `v_current_salary` view** | Clean history; view keeps listing/sorting simple. Fallback: denormalize `current_salary_usd` onto `employees` if sort-by-salary slows. |
| Salary semantics | **Store `base_salary` as annual gross**; monthly = /12 | One canonical unit avoids aggregate ambiguity. |
| Migrations | **Tiny ordered, idempotent SQL migration runner** | Explicit and reviewable; no heavy ORM tooling. |

---

## 3. Database Design

```mermaid
erDiagram
    EMPLOYEES ||--o{ SALARIES : "has history"
    CURRENCIES ||--o{ SALARIES : "denominated in"
    CURRENCIES ||--o{ EMPLOYEES : "default currency"

    EMPLOYEES {
        integer id PK
        text    name
        text    email UK
        text    country
        text    department
        text    currency_code FK
        text    status "active|inactive"
        text    joining_date "ISO date"
        text    created_at
        text    updated_at
    }
    SALARIES {
        integer id PK
        integer employee_id FK
        real    base_salary "annual gross"
        text    currency_code FK
        text    country
        text    effective_date "ISO date"
        text    created_at
    }
    CURRENCIES {
        text code PK "USD, EUR, INR..."
        text name
        text symbol
        real rate_to_usd "1 unit = X USD"
    }
```

**Indexes (fast search/filter/sort at 10k):**

- `employees(email)` UNIQUE
- `employees(country)`, `employees(department)`, `employees(status)` — filters
- `employees(name)` — search (`LIKE 'term%'`; FTS5 noted as upgrade)
- `salaries(employee_id, effective_date DESC)` — history + current-salary view
- View `v_current_salary` → latest salary per employee, exposing
  `base_salary_usd = base_salary * rate_to_usd`

**PRAGMAs:** `journal_mode=WAL`, `foreign_keys=ON`.

**Notes:** `country`/`department` kept as indexed text (lookup tables would be
over-normalization at this scale). FX *must* be a table because aggregation depends
on conversion.

---

## 4. API Design

Base path `/api/v1`. All responses use the envelope
`{success, data, meta?}` / `{success, error}`.

| Method | Path | Purpose | Query / Body | Success |
|---|---|---|---|---|
| GET | `/employees` | List + search + filter + sort + paginate | `search, country, department, status, sort(name\|salary\|joining_date), order, page, limit` | `data: Employee[]`, `meta: pagination` |
| GET | `/employees/:id` | Detail (+ current salary) | — | `data: EmployeeDetail` |
| POST | `/employees` | Create (+ initial salary) | `{name,email,country,department,currency_code,joining_date,base_salary,effective_date}` | `201 data: Employee` |
| PATCH | `/employees/:id` | Update fields | partial employee | `data: Employee` |
| GET | `/employees/:id/salaries` | Salary history (desc) | — | `data: Salary[]` |
| POST | `/employees/:id/salaries` | Add salary record (raise) | `{base_salary,currency_code,effective_date}` | `201 data: Salary` |
| GET | `/analytics/summary` | Total/avg/min/max payroll, headcount (USD) | — | `data: Summary` |
| GET | `/analytics/by-country` | Payroll + avg + headcount per country | — | `data: CountryStat[]` |
| GET | `/analytics/by-department` | Payroll + avg + headcount per department | — | `data: DeptStat[]` |
| GET | `/analytics/distribution` | Salary band histogram | `buckets?` | `data: Bucket[]` |
| GET | `/analytics/top-earners` | Top-N highest paid | `limit=10` | `data: Employee[]` |
| GET | `/health` | Liveness | — | `{status:'ok'}` |

---

## 5. Folder Structures

**Backend** (module-per-domain + Repository layer)

```
backend/src/
├─ modules/
│  ├─ employees/   employee.controller|service|repository|validation|types.ts
│  ├─ salaries/    salary.controller|service|repository|validation|types.ts
│  └─ analytics/   analytics.controller|service|repository|types.ts
├─ routes/index.ts
├─ middleware/     validate · errorHandler · notFoundHandler · rateLimiter
├─ database/       connection.ts · migrations/ · views.sql · seed.ts
├─ shared/
│  ├─ errors/      AppError · NotFoundError · ConflictError · ValidationError
│  └─ utils/       response.utils · pagination.utils · currency.utils
├─ config/         env.ts (zod) · logger.ts
├─ app.ts · server.ts
└─ tests/          unit (services) · integration (supertest) · repo (:memory:)
```

**Frontend** (feature-based structure)

```
frontend/src/
├─ app/            store.ts · hooks.ts · router.tsx · providers.tsx
├─ features/
│  ├─ employees/   api/ components/ pages/ types/ (filter slice)
│  ├─ salaries/    api/ components/ types/
│  └─ analytics/   api/ components/ pages/ types/
├─ pages/          route-level shells
├─ components/     shared + ui/ (Shadcn)
├─ layouts/        AppShell · Header · Sidebar
├─ services/       baseQuery.ts (RTK Query base)
├─ hooks/          useDebounce · useToast
├─ store/          rootReducer / UI slices
├─ types/          api.types · common.types
└─ tests/          component (RTL) · slice · MSW handlers
```

---

## 6. Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Repository | Vitest + `:memory:` SQLite | Real SQL on seeded fixtures: filtering, pagination, current-salary view, aggregation incl. currency conversion |
| Service | Vitest + mocked repo | Business rules: monthly = annual/12, distribution bucketing, latest-effective selection, error paths (NotFound/Conflict on dup email) |
| API / integration | Vitest + supertest | Route → middleware → controller: happy path, 422 validation, 404, envelope shape |
| FE components | Vitest + React Testing Library | Render states: **loading / empty / error / data**; filter+search interactions; pagination |
| FE data | MSW | Mock RTK Query endpoints; table renders; debounced search fires once |
| FE store | Vitest | Filter slice reducers + selectors |

**Priorities:** analytics correctness (currency conversion is highest risk) and the
four UI states required by the NFRs. Meaningful coverage on services/repos over
vanity 100%.

---

## 7. Deployment Strategy

```mermaid
flowchart LR
    Dev["GitHub repo"] --> V["Vercel<br/>(frontend build)"]
    Dev --> R["Render Web Service<br/>(Express)"]
    R --- D[("Persistent Disk<br/>/data/app.db")]
    V -- "VITE_API_URL" --> R
```

- **Frontend → Vercel:** static Vite build; `VITE_API_URL` points at backend;
  SPA rewrite to `index.html`.
- **Backend → Render Web Service:** Node start; run migrations + seed on first boot
  (idempotent).
- **⚠️ Top risk — SQLite persistence:** Render/Railway default filesystems are
  **ephemeral**; the `.db` is wiped on redeploy. **Mitigation:** attach a **Render
  Persistent Disk** mounting the DB at `/data/app.db` (`DB_PATH` env). Alternatives:
  **Turso/libSQL** (hosted, swap driver), **Fly.io volume**, or **LiteFS**. Decide
  before deploy.
- **CORS** locked to the Vercel origin; `helmet` + rate limiting on.
- Seed guarded (row-count check) so restarts don't duplicate data.

---

## 8. AI Usage Strategy

AI is used **only as a development accelerator** — there is no AI/LLM inside the
running application. All payroll questions are answered by deterministic SQL
aggregations (§4).

**Where AI assists the build (Claude Code):** scaffolding (repositories, RTK Query
slices, Shadcn wiring), seed/faker logic, test drafting, and this design document.

**Guardrails:** every aggregation is verified against hand-computed fixtures;
generated code is reviewed for SQL injection (parameterized queries only) and
envelope/type consistency; nothing is committed unrun. Commit messages note where AI
did the heavy lifting, for transparency.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Ephemeral FS wipes SQLite on redeploy | Data loss | Persistent disk / Turso (decide pre-deploy) |
| Mixed-currency aggregation wrong | Misleading payroll numbers | Conversion in SQL via `rate_to_usd`; fixture-tested |
| Salary ambiguity (annual vs monthly) | Wrong totals | Canonical = annual gross; monthly derived |
| Sort-by-salary over view slow at 10k | Sluggish listing | Index + view; fallback denormalize `current_salary_usd` |
| Single SQLite writer | Concurrent writes block | WAL mode; single-user persona makes it a non-issue |
| Seed re-runs duplicate data | Inflated counts | Idempotent seed (count guard / truncate flag) |

---

## 10. Phase-wise Execution + Git Commit Plan

Conventional Commits, small and incremental (to show how the solution evolved).

| Phase | Outcome | Representative commits |
|---|---|---|
| **0 — Foundation** | Monorepo, TS, lint, env | `chore: init monorepo workspaces` · `chore(be): express+ts+eslint setup` · `chore(fe): vite+tailwind+shadcn setup` |
| **1 — DB & Seed** | Schema, migrations, view, 10k seed | `feat(db): employees/salaries/currencies schema + indexes` · `feat(db): v_current_salary view` · `feat(db): seed 10k employees (faker)` |
| **2 — BE Employees** | CRUD + search/filter/sort/paginate | `feat(be): response envelope + error hierarchy + validate mw` · `feat(be): employee repository (sql)` · `feat(be): employee service+controller+routes` · `test(be): employee repo + service` |
| **3 — BE Salaries** | History + raises | `feat(be): salary history endpoints` · `test(be): latest-effective logic` |
| **4 — BE Analytics** | Aggregation endpoints + currency norm | `feat(be): analytics summary/by-country/by-department` · `feat(be): distribution + top-earners` · `test(be): aggregation correctness fixtures` |
| **5 — FE Shell** | Layout, store, RTK Query base, routing | `feat(fe): app shell + sidebar + router` · `feat(fe): rtk query baseQuery + store` |
| **6 — FE Employees** | List, detail, create/edit, all 4 states | `feat(fe): employees table + filters + pagination` · `feat(fe): employee detail + salary history` · `feat(fe): create/edit forms (zod)` · `test(fe): list states + filters` |
| **7 — FE Analytics** | Dashboard cards + charts + AI Insights | `feat(fe): dashboard KPI cards + by-country chart` · `feat(fe): distribution + top earners` · `feat(fe): AI insights canned questions` · `test(fe): dashboard render` |
| **8 — Harden & Deploy** | Docs, deploy, persistence | `docs: README + architecture + requirements` · `chore: deploy config (vercel+render+disk)` · `chore: idempotent seed guard` |

---

## 11. Open Decisions (needed before implementation)

1. **Auth** — none, or a thin single-user login gate?
   *(Recommended: none for core; structure allows adding it.)*
2. **SQLite persistence target** — Render Persistent Disk (simplest) vs. Turso/libSQL?
   *(Affects the DB connection layer.)*
3. **Data-access style** — hand-written SQL in repositories (recommended; shows
   fundamentals) vs. Drizzle ORM.
