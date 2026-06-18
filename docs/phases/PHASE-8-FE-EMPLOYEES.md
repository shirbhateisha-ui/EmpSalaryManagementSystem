# Phase 8 — Frontend: Employees

**Goal:** Deliver the Employees experience — a performant list (search, filters,
sorting, pagination), detail view with salary history, and create/edit forms — with
all four UI states handled.

**Depends on:** [Phase 7 — Frontend: Auth & Guards](./PHASE-7-FE-AUTH-GUARDS.md),
[Phase 4 — Backend: Salaries](./PHASE-4-BE-SALARIES.md).

---

## Tasks

### Employees feature scaffolding
- [ ] `features/employees` with `api/`, `components/`, `pages/`, `types/`.
- [ ] RTK Query `employees.api` (list, getById, create, update).
- [ ] Filter UI state slice (search term, country, department, status, sort, page).

### List view
- [ ] Data table with columns (name, email, country, department, current salary, status).
- [ ] Search input with **debounce** (single query per keystroke burst).
- [ ] Filters (country, department, status) and sortable columns.
- [ ] Pagination controls bound to `meta` (`page`, `totalPages`, `hasNext/hasPrev`).
- [ ] Render **loading / empty / error / data** states.

### Detail & forms
- [ ] Employee detail page showing profile + **salary history** (and add-raise action).
- [ ] Create employee form (Shadcn + Zod validation).
- [ ] Edit employee form; optimistic or refetch-on-success update.
- [ ] Create / edit / add-raise actions are shown only to `HR_MANAGER`/`ADMIN`
      (via `RoleGuard`); Viewers see read-only screens.

### Tests
- [ ] List renders loading / empty / error / data states (RTL + MSW).
- [ ] Search debounces and filters/pagination update results.

---

## Deliverables
- Full Employees UI: list, detail + history, create/edit, all states handled.

## Definition of Done
- [ ] List performs well over the 10k dataset (server-side paginate/filter/sort).
- [ ] Create/edit validate input and reflect changes after success.
- [ ] Detail shows salary history and supports adding a raise.
- [ ] List-state and filter tests pass.

## Suggested commits
- `feat(fe): employees table + filters + pagination`
- `feat(fe): employee detail + salary history`
- `feat(fe): create/edit forms (zod)`
- `test(fe): list states + filters`
