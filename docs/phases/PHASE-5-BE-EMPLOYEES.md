# Phase 5 — Backend: Employees

**Goal:** Deliver the Employees module end-to-end following clean layering
(`Route → Controller → Service → Repository`), reusing the shared infrastructure and
auth guards built in Phase 2.

**Depends on:** [Phase 2 — Backend: Auth & RBAC](./PHASE-2-BE-AUTH-RBAC.md)
(shared envelope/errors/validate + `authenticate`/`authorize`).

---

## Tasks

### Employees module

- [x] `employee.repository` — typed SQL: list (search/filter/sort/paginate), get,
      create, update. Joins `v_current_salary` for current salary.
- [x] `employee.service` — business rules; conflict on duplicate email.
- [x] `employee.validation` — Zod schemas for create/update/list query.
- [x] `employee.controller` + `employee.routes`.
- [x] Endpoints: `GET /employees`, `GET /employees/:id`, `POST /employees`,
      `PATCH /employees/:id`.

### Access control

- [x] All routes require a valid access token (`authenticate`).
- [x] Write routes (`POST`, `PATCH`) require `authorize('HR_MANAGER')` (Admin inherits);
      reads allow any authenticated role.

### Tests

- [x] Repository tests against `:memory:` SQLite: filter/search/sort/pagination.
- [x] Service unit tests (mocked repo): create/update + duplicate-email conflict.

---

## Deliverables

- Full Employees CRUD with search/filter/sort/pagination, protected by RBAC.

## Definition of Done

- [x] All employee endpoints return the standard envelope and correct status codes.
- [x] Invalid input → 422; unknown id → 404; duplicate email → 409.
- [x] Unauthorized → 401; wrong role on writes → 403.
- [x] Listing supports search, filter, sort, and pagination over the 10k seed.
- [x] Employee + service tests pass.

## Suggested commits

- `feat(be): employee repository (sql)`
- `feat(be): employee service+controller+routes (guarded)`
- `test(be): employee repo + service`
