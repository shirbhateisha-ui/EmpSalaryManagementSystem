# Phase 1 — DB & Seed

**Goal:** Implement the SQLite schema, indexes, current-salary view, a small migration
runner, and a seed script generating 10,000 realistic employees. This lands before the
backend modules so they can be built against a real database.

**Depends on:** [Phase 0 — Foundation](./PHASE-0-FOUNDATION.md).

---

## Tasks

### Connection

- [ ] `database/connection.ts` using **better-sqlite3**, reading `DB_PATH`.
- [ ] Enable PRAGMAs: `journal_mode=WAL`, `foreign_keys=ON`.
- [ ] Export a single shared DB instance.

### Migrations

- [ ] Small **ordered, idempotent migration runner** (tracks applied migrations).
- [ ] `currencies` table (`code` PK, `name`, `symbol`, `rate_to_usd`).
- [ ] `employees` table (id, name, email UNIQUE, country, department, currency_code FK,
      status, joining_date, created_at, updated_at).
- [ ] `salaries` table (id, employee_id FK, base_salary, currency_code FK, country,
      effective_date, created_at).
- [ ] `users` table (id, name, email UNIQUE, password_hash, role
      `ADMIN|HR_MANAGER|VIEWER`, status, created_at, updated_at).
- [ ] `refresh_tokens` table (id, user_id FK, token_hash, expires_at, revoked_at,
      created_at).

### Indexes & view

- [ ] Indexes: `employees(email)` UNIQUE, `employees(country)`,
      `employees(department)`, `employees(status)`, `employees(name)`.
- [ ] Index: `salaries(employee_id, effective_date DESC)`.
- [ ] Indexes: `users(email)` UNIQUE, `refresh_tokens(token_hash)`,
      `refresh_tokens(user_id)`.
- [ ] View `v_current_salary` — latest salary per employee, exposing
      `base_salary_usd = base_salary * rate_to_usd`.

### Seed

- [ ] Seed `currencies` with a fixed set + `rate_to_usd`.
- [ ] Seed **10,000 employees** with realistic name, unique email, country,
      department, currency, joining date (faker).
- [ ] Seed an initial salary per employee; give some multiple history records (raises).
- [ ] Seed an initial **Admin user** (credentials from env; password hashed with bcrypt).
- [ ] Make the seed **idempotent** (row-count guard or `--reset` flag).

---

## Deliverables

- Migrated SQLite database with indexes and the current-salary view.
- Reproducible 10k-employee seed.

## Definition of Done

- [ ] Fresh migrate → seed produces exactly 10,000 employees.
- [ ] Re-running seed does not duplicate data.
- [ ] `v_current_salary` returns one current row per employee with USD value.

## Suggested commits

- `feat(db): employees/salaries/currencies schema + indexes`
- `feat(db): users + refresh_tokens schema`
- `feat(db): v_current_salary view`
- `feat(db): seed 10k employees (faker) + admin user`
