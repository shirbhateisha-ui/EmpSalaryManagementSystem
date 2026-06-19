# Phase 7 — Backend: Analytics

**Goal:** Deliver the reporting endpoints that answer the HR Manager's payroll
questions via deterministic SQL aggregations, with all amounts normalized to USD.

**Depends on:** [Phase 5 — Backend: Employees](./PHASE-5-BE-EMPLOYEES.md),
[Phase 6 — Backend: Salaries](./PHASE-6-BE-SALARIES.md).

---

## Tasks

### Analytics module

- [x] `currency.utils` / SQL conversion — amounts to USD via `rate_to_usd`.
- [x] `analytics.repository` — aggregation SQL over `v_current_salary`.
- [x] `analytics.service` — monthly = annual / 12; distribution bucketing; top-N.
- [x] `analytics.controller` + `analytics.routes` (all guarded by `authenticate`; any role).

### Endpoints

- [x] `GET /analytics/summary` — total (annual + monthly), avg, min, max, headcount (USD).
- [x] `GET /analytics/by-country` — payroll + avg + headcount per country.
- [x] `GET /analytics/by-department` — payroll + avg + headcount per department.
- [x] `GET /analytics/distribution` — salary band histogram.
- [x] `GET /analytics/top-earners?limit=10` — top-N highest paid.

### Tests

- [x] Aggregation correctness against hand-computed fixtures (mixed currencies).
- [x] Monthly = annual / 12; distribution bucket boundaries; top-N ordering.

---

## Deliverables

- Reporting endpoints returning correct USD-normalized analytics.

## Definition of Done

- [x] Cross-currency totals match a manual SQL calculation.
- [x] All analytics endpoints return the standard envelope.
- [x] Aggregation correctness fixtures pass.

## Suggested commits

- `feat(be): analytics summary/by-country/by-department`
- `feat(be): distribution + top-earners`
- `test(be): aggregation correctness fixtures`
