# Phase 6 — Backend: Salaries

**Goal:** Deliver salary history and raises. Adding a salary creates a new record
(additive history); "current salary" is always the latest effective record.

**Depends on:** [Phase 5 — Backend: Employees](./PHASE-5-BE-EMPLOYEES.md).

---

## Tasks

### Salaries module

- [ ] `salary.repository` — fetch history (effective_date desc), insert salary record,
      resolve latest-effective.
- [ ] `salary.service` — adding a raise creates a new record; never overwrite history.
- [ ] `salary.validation` — Zod schema for adding a salary record.
- [ ] `salary.controller` + `salary.routes`.
- [ ] Endpoints: `GET /employees/:id/salaries` (any role),
      `POST /employees/:id/salaries` (`authorize('HR_MANAGER')`).

### Integration with employees

- [ ] Employee detail surfaces the current salary (via `v_current_salary`).
- [ ] Adding a salary updates what the current-salary view returns.

### Tests

- [ ] Latest-effective logic: with multiple records, the most recent effective_date
      is returned as current.
- [ ] Adding a raise appends a record and does not mutate prior records.

---

## Deliverables

- Salary history endpoints with additive raise semantics.

## Definition of Done

- [ ] History returns records in descending effective-date order.
- [ ] Posting a raise creates a new record and updates the current salary.
- [ ] Latest-effective tests pass.

## Suggested commits

- `feat(be): salary history endpoints`
- `test(be): latest-effective logic`
