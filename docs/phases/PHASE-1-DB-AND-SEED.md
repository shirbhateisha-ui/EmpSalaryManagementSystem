# Phase 1 — DB & Seed

**Goal:** Implement the SQLite schema, indexes, current-salary view, a small migration
runner, and a seed script generating 10,000 realistic employees. This lands before the
backend modules so they can be built against a real database.

**Depends on:** [Phase 0 — Foundation](./PHASE-0-FOUNDATION.md).

**Status:** ✅ Complete — `db:migrate` applies all migrations; `db:seed` produces 10,000
employees; re-run is idempotent; `v_current_salary` returns one row per employee with USD
values; `typecheck` and `lint` pass.

---

## Tasks

### Connection

- [x] `database/connection.ts` using **better-sqlite3**, reading `DB_PATH`.
- [x] Enable PRAGMAs: `journal_mode=WAL`, `foreign_keys=ON`.
- [x] Export a single shared DB instance.

### Migrations

- [x] Small **ordered, idempotent migration runner** (tracks applied migrations).
- [x] `currencies` table (`code` PK, `name`, `symbol`, `rate_to_usd`).
- [x] `employees` table (id, name, email UNIQUE, country, department, currency_code FK,
      status, joining_date, created_at, updated_at).
- [x] `salaries` table (id, employee_id FK, base_salary, currency_code FK, country,
      effective_date, created_at).
- [x] `users` table (id, name, email UNIQUE, password_hash, role
      `ADMIN|HR_MANAGER|VIEWER`, status, created_at, updated_at).
- [x] `refresh_tokens` table (id, user_id FK, token_hash, expires_at, revoked_at,
      created_at).

### Indexes & view

- [x] Indexes: `employees(email)` UNIQUE, `employees(country)`,
      `employees(department)`, `employees(status)`, `employees(name)`.
- [x] Index: `salaries(employee_id, effective_date DESC)`.
- [x] Indexes: `users(email)` UNIQUE, `refresh_tokens(token_hash)`,
      `refresh_tokens(user_id)`.
- [x] View `v_current_salary` — latest salary per employee, exposing
      `base_salary_usd = base_salary * rate_to_usd`.

### Seed

- [x] Seed `currencies` with a fixed set + `rate_to_usd`.
- [x] Seed **10,000 employees** with realistic name, unique email, country,
      department, currency, joining date (faker).
- [x] Seed an initial salary per employee; give some multiple history records (raises).
- [x] Seed an initial **Admin user** (credentials from env; password hashed with bcrypt).
- [x] Make the seed **idempotent** (row-count guard or `--reset` flag).

---

## Deliverables

- Migrated SQLite database with indexes and the current-salary view.
- Reproducible 10k-employee seed.

## Definition of Done

- [x] Fresh migrate → seed produces exactly 10,000 employees.
- [x] Re-running seed does not duplicate data.
- [x] `v_current_salary` returns one current row per employee with USD value.

## Suggested commits

- `feat(db): employees/salaries/currencies schema + indexes`
- `feat(db): users + refresh_tokens schema`
- `feat(db): v_current_salary view`
- `feat(db): seed 10k employees (faker) + admin user`
