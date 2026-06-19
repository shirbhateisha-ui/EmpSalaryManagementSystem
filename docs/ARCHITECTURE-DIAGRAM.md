# Architecture Diagram

> Visual overview of the system. For narrative explanation of each layer see
> [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER  (React 18 + Vite 5 + RTK Query + Tailwind CSS + Shadcn UI)   │
│                                                                         │
│  ┌──────────────┐  ┌────────────────────┐  ┌───────────────────────┐   │
│  │  Auth        │  │  Employees         │  │  Analytics            │   │
│  │  ─────────── │  │  ────────────────  │  │  ─────────────────── │   │
│  │  Login page  │  │  List + filters    │  │  KPI cards            │   │
│  │  Auth slice  │  │  Debounced search  │  │  CSS bar charts       │   │
│  │  AuthGuard   │  │  Detail page       │  │  Top earners table    │   │
│  │  RoleGuard   │  │  Salary history    │  │  Insights panel       │   │
│  │  User menu   │  │  Add raise         │  │  (5 preset Q&A)       │   │
│  └──────────────┘  └────────────────────┘  └───────────────────────┘   │
│                                                                         │
│  App Shell: Sidebar nav · Header · Router (React Router v6)             │
│  RTK Query baseQuery: attaches Bearer token · refresh-on-401            │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS · JSON · Authorization: Bearer <jwt>
                               │ httpOnly cookie for refresh token
┌──────────────────────────────▼──────────────────────────────────────────┐
│  EXPRESS MIDDLEWARE STACK  (Node.js + TypeScript)                       │
│                                                                         │
│  cors → helmet → rateLimiter → authenticate(JWT) → authorize(roles)    │
│  → validate(Zod) → [route handler] → errorHandler                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────────┐
              │                │                    │
┌─────────────▼──┐  ┌──────────▼──────┐  ┌─────────▼───────────────────┐
│  Auth Module   │  │  Users Module   │  │  Employees + Salaries Module │
│  ─────────── │  │  ──────────────  │  │  ────────────────────────── │
│  POST /login   │  │  GET  /users    │  │  GET    /employees           │
│  POST /refresh │  │  POST /users    │  │  GET    /employees/:id       │
│  POST /logout  │  │  PATCH/users/:id│  │  POST   /employees           │
│  GET  /me      │  │  (ADMIN only)   │  │  PATCH  /employees/:id       │
│                │  │                 │  │  GET    /employees/:id/salaries│
│  bcrypt verify │  │  bcrypt hash    │  │  POST   /employees/:id/salaries│
│  sign JWT      │  │  role guard     │  └───────────────────────────────┘
│  rotate cookie │  └─────────────────┘
└────────────────┘
                                           ┌────────────────────────────┐
                                           │  Analytics Module          │
                                           │  ──────────────────────── │
                                           │  GET /analytics/summary    │
                                           │  GET /analytics/by-country │
                                           │  GET /analytics/by-dept    │
                                           │  GET /analytics/distribution│
                                           │  GET /analytics/top-earners│
                                           └───────────────────────────-┘

All modules follow: Route → Controller → Service → Repository

┌─────────────────────────────────────────────────────────────────────────┐
│  SQLITE DATABASE  (better-sqlite3 · WAL mode · FK enforcement)          │
│                                                                         │
│  ┌───────────┐  ┌────────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  users    │  │ refresh_tokens │  │employees │  │    salaries     │  │
│  │ ───────── │  │ ────────────── │  │ ──────── │  │ ─────────────── │  │
│  │ id        │  │ id             │  │ id       │  │ id              │  │
│  │ name      │  │ user_id   FK──►│  │ name     │  │ employee_id  FK│  │
│  │ email     │  │ token_hash     │  │ email    │  │ base_salary    │  │
│  │ pwd_hash  │  │ expires_at     │  │ country  │  │ currency_code  │  │
│  │ role      │  │ revoked_at     │  │ dept     │  │ effective_date │  │
│  │ status    │  │ created_at     │  │ status   │  │ created_at     │  │
│  └───────────┘  └────────────────┘  └──────────┘  └─────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────┐  ┌───────────────┐  │
│  │  v_current_salary  (VIEW)                     │  │  currencies   │  │
│  │  ─────────────────────────────────────────── │  │ ──────────── │  │
│  │  employee_id, salary_id, base_salary,         │  │ code  PK     │  │
│  │  currency_code, effective_date,               │  │ rate_to_usd  │  │
│  │  base_salary_usd = base_salary * rate_to_usd  │  └───────────────┘  │
│  │  (latest salary per employee via MAX(id))     │                     │
│  └───────────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Authenticated API Call

```
Browser                   RTK Query baseQuery          Express               SQLite
  │                              │                        │                    │
  │── useListEmployeesQuery() ──▶│                        │                    │
  │                              │── GET /employees ─────▶│                    │
  │                              │   Authorization: Bearer │                    │
  │                              │                        │── authenticate() ──│
  │                              │                        │   jwt.verify()     │
  │                              │                        │   req.user = {...} │
  │                              │                        │                    │
  │                              │                        │── controller ──────│
  │                              │                        │── service ─────────│
  │                              │                        │── repository ──────│
  │                              │                        │   SELECT + JOIN ──▶│
  │                              │                        │◀── typed rows ─────│
  │                              │                        │                    │
  │                              │◀── { success, data } ──│                    │
  │◀── { data: employees[] } ────│                        │                    │
```

---

## Request Flow: Token Refresh (on 401)

```
Browser           RTK Query baseQuery        Express           SQLite
  │                      │                      │                 │
  │                      │── GET /something ───▶│                 │
  │                      │                      │── 401 (expired)─│
  │                      │◀── 401 ──────────────│                 │
  │                      │                      │                 │
  │                      │── POST /auth/refresh ▶│                │
  │                      │   (httpOnly cookie)   │── lookup hash ▶│
  │                      │                       │── revoke old ─▶│
  │                      │                       │── insert new ─▶│
  │                      │◀── { accessToken } ───│                │
  │                      │    Set-Cookie: new     │                │
  │                      │                       │                │
  │                      │── GET /something ────▶│ (retry) ──────▶│
  │◀── data ─────────────│◀── { success, data } ─│                │
```

---

## Entity Relationship Diagram

```
USERS ──────────────────── REFRESH_TOKENS
  │  id (PK)                    id (PK)
  │  name                       user_id (FK → users.id)
  │  email (UNIQUE)             token_hash
  │  password_hash              expires_at
  │  role                       revoked_at
  │  status


EMPLOYEES ──────────────── SALARIES ─────────── CURRENCIES
  id (PK)                    id (PK)               code (PK)
  name                       employee_id (FK)       rate_to_usd
  email (UNIQUE)             base_salary
  country                    currency_code (FK ──▶ currencies.code)
  department                 country
  currency_code (FK)         effective_date
  status                     created_at
  joining_date
                     ▼
            v_current_salary (VIEW)
            ─────────────────────────────
            employee_id
            salary_id
            base_salary
            currency_code
            effective_date
            base_salary_usd  ← base_salary * rate_to_usd
```

---

## Folder Structure

```
EmpSalaryManagementSystem/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/         controller · service · repository · validation · types
│       │   ├── users/        controller · service · repository · validation · types
│       │   ├── employees/    controller · service · repository · validation · types
│       │   ├── salaries/     controller · service · repository · validation · types
│       │   └── analytics/    controller · service · repository · types
│       ├── middleware/        authenticate · authorize · validate · errorHandler
│       ├── database/          connection · migrations/ · seed.ts
│       ├── shared/
│       │   ├── errors/        AppError hierarchy
│       │   └── utils/         response · pagination · jwt · password · currency
│       ├── config/            env.ts (Zod) · logger.ts
│       ├── routes/            index.ts
│       ├── app.ts
│       └── tests/             auth · employees · salaries · analytics · helpers/
│
└── frontend/
    └── src/
        ├── app/               store · hooks · router · providers
        ├── features/
        │   ├── auth/          api/ · components/ · pages/ · store/ · types/
        │   ├── users/         api/ · components/ · pages/ · types/
        │   ├── employees/     api/ · components/ · pages/ · types/
        │   └── analytics/     api/ · components/ · pages/ · types/
        ├── layouts/           AppShell · Header · Sidebar
        ├── components/        ui/ (Shadcn) · states/ (Loading/Error/Empty)
        ├── services/          baseQuery.ts
        ├── hooks/             useDebounce · useAuth
        └── tests/             auth · employees · analytics · guards
```
