# Phase 8 — Frontend: Employees

**Goal:** Deliver the Employees experience — a performant list (search, filters,
sorting, pagination), detail view with salary history, and create/edit forms — with
all four UI states handled.

**Depends on:** [Phase 4 — Frontend: Auth & Guards](./PHASE-4-FE-AUTH-GUARDS.md),
[Phase 6 — Backend: Salaries](./PHASE-6-BE-SALARIES.md).

---

## Tasks

### Employees feature scaffolding

- [x] `features/employees` with `api/`, `components/`, `pages/`, `types/`.
- [x] RTK Query `employees.api` (list, getById, create, update).
- [x] Filter UI state slice (search term, country, department, status, sort, page).

### List view

- [x] Data table with columns (name, email, country, department, current salary, status).
- [x] Search input with **debounce** (single query per keystroke burst).
- [x] Filters (country, department, status) and sortable columns.
- [x] Pagination controls bound to `meta` (`page`, `totalPages`, `hasNext/hasPrev`).
- [x] Render **loading / empty / error / data** states.

### Detail & forms

- [x] Employee detail page showing profile + **salary history** (and add-raise action).
- [x] Create employee form (Shadcn + Zod validation).
- [x] Edit employee form; optimistic or refetch-on-success update.
- [x] Create / edit / add-raise actions are shown only to `HR_MANAGER`/`ADMIN`
      (via `RoleGuard`); Viewers see read-only screens.

### Tests

- [x] List renders loading / empty / error / data states (RTL + MSW).
- [x] Search debounces and filters/pagination update results.

---

## Deliverables

- Full Employees UI: list, detail + history, create/edit, all states handled.

## Definition of Done

- [x] List performs well over the 10k dataset (server-side paginate/filter/sort).
- [x] Create/edit validate input and reflect changes after success.
- [x] Detail shows salary history and supports adding a raise.
- [x] List-state and filter tests pass.

## Suggested commits

- `feat(fe): employees table + filters + pagination`
- `feat(fe): employee detail + salary history`
- `feat(fe): create/edit forms (zod)`
- `test(fe): list states + filters`
