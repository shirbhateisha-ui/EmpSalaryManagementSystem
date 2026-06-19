# Phase 9 — Frontend: Analytics

**Goal:** Deliver the analytics dashboard — KPI cards, charts, and an
insights/reporting panel that answers the HR Manager's common payroll questions
(deterministic SQL, no AI in the app).

**Depends on:** [Phase 3 — Frontend: Shell](./PHASE-3-FE-SHELL.md),
[Phase 7 — Backend: Analytics](./PHASE-7-BE-ANALYTICS.md).

---

## Tasks

### Analytics feature scaffolding

- [x] `features/analytics` with `api/`, `components/`, `pages/`, `types/`.
- [x] RTK Query `analytics.api` (summary, by-country, by-department, distribution, top-earners).

### Dashboard

- [x] **KPI cards**: total payroll (annual + monthly), average, highest, lowest, headcount.
- [x] **By-country** chart (payroll cost / average).
- [x] **Salary distribution** chart (histogram bands).
- [x] **Top earners** table (top 10).

### Insights / reporting panel

- [x] Preset questions that map to analytics endpoints, e.g.:
      "monthly spend", "highest-cost country", "avg salary by country",
      "top 10 paid", "distribution breakdown".
- [x] Each question renders the corresponding result (no LLM; direct endpoint calls).

### States & tests

- [x] Cards/charts handle **loading / empty / error / data** states.
- [x] Dashboard render test (RTL + MSW) with data and empty state.

---

## Deliverables

- Analytics dashboard with KPIs, charts, top earners, and a reporting panel.

## Definition of Done

- [x] Dashboard displays correct, USD-normalized figures from the API.
- [x] Reporting panel answers each preset question correctly.
- [x] All four UI states handled; dashboard render test passes.

## Suggested commits

- `feat(fe): dashboard KPI cards + by-country chart`
- `feat(fe): distribution + top earners`
- `feat(fe): insights reporting questions`
- `test(fe): dashboard render`
