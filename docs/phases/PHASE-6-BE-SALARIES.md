# Phase 6 — Backend: Salaries

**Goal:** Deliver salary history and raises. Adding a salary creates a new record
(additive history); "current salary" is always the latest effective record.

**Depends on:** [Phase 5 — Backend: Employees](./PHASE-5-BE-EMPLOYEES.md).

---

## Tasks

### Salaries module

- [x] `salary.repository` — fetch history (effective_date desc), insert salary record,
      resolve latest-effective.
- [x] `salary.service` — adding a raise creates a new record; never overwrite history.
- [x] `salary.validation` — Zod schema for adding a salary record.
- [x] `salary.controller` + `salary.routes`.
- [x] Endpoints: `GET /employees/:id/salaries` (any role),
      `POST /employees/:id/salaries` (`authorize('HR_MANAGER')`).

### Integration with employees

- [x] Employee detail surfaces the current salary (via `v_current_salary`).
- [x] Adding a salary updates what the current-salary view returns.

### Tests

- [x] Latest-effective logic: with multiple records, the most recent effective_date
      is returned as current.
- [x] Adding a raise appends a record and does not mutate prior records.

---

## Deliverables

- Salary history endpoints with additive raise semantics.

## Definition of Done

- [x] History returns records in descending effective-date order.
- [x] Posting a raise creates a new record and updates the current salary.
- [x] Latest-effective tests pass.

## Suggested commits

- `feat(be): salary history endpoints`
- `test(be): latest-effective logic`
