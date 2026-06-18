# Phase 3 — Backend: Employees

**Goal:** Deliver the Employees module end-to-end following clean layering
(`Route → Controller → Service → Repository`), reusing the shared infrastructure and
auth guards built in Phase 2.

**Depends on:** [Phase 2 — Backend: Auth & RBAC](./PHASE-2-BE-AUTH-RBAC.md)
(shared envelope/errors/validate + `authenticate`/`authorize`).

---

## Tasks

### Employees module

- [ ] `employee.repository` — typed SQL: list (search/filter/sort/paginate), get,
      create, update. Joins `v_current_salary` for current salary.
- [ ] `employee.service` — business rules; conflict on duplicate email.
- [ ] `employee.validation` — Zod schemas for create/update/list query.
- [ ] `employee.controller` + `employee.routes`.
- [ ] Endpoints: `GET /employees`, `GET /employees/:id`, `POST /employees`,
      `PATCH /employees/:id`.

### Access control

- [ ] All routes require a valid access token (`authenticate`).
- [ ] Write routes (`POST`, `PATCH`) require `authorize('HR_MANAGER')` (Admin inherits);
      reads allow any authenticated role.

### Tests

- [ ] Repository tests against `:memory:` SQLite: filter/search/sort/pagination.
- [ ] Service unit tests (mocked repo): create/update + duplicate-email conflict.

---

## Deliverables

- Full Employees CRUD with search/filter/sort/pagination, protected by RBAC.

## Definition of Done

- [ ] All employee endpoints return the standard envelope and correct status codes.
- [ ] Invalid input → 422; unknown id → 404; duplicate email → 409.
- [ ] Unauthorized → 401; wrong role on writes → 403.
- [ ] Listing supports search, filter, sort, and pagination over the 10k seed.
- [ ] Employee + service tests pass.

## Suggested commits

- `feat(be): employee repository (sql)`
- `feat(be): employee service+controller+routes (guarded)`
- `test(be): employee repo + service`
