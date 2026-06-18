# Phase 9 — Frontend: Analytics

**Goal:** Deliver the analytics dashboard — KPI cards, charts, and an
insights/reporting panel that answers the HR Manager's common payroll questions
(deterministic SQL, no AI in the app).

**Depends on:** [Phase 6 — Frontend: Shell](./PHASE-6-FE-SHELL.md),
[Phase 5 — Backend: Analytics](./PHASE-5-BE-ANALYTICS.md).

---

## Tasks

### Analytics feature scaffolding
- [ ] `features/analytics` with `api/`, `components/`, `pages/`, `types/`.
- [ ] RTK Query `analytics.api` (summary, by-country, by-department, distribution, top-earners).

### Dashboard
- [ ] **KPI cards**: total payroll (annual + monthly), average, highest, lowest, headcount.
- [ ] **By-country** chart (payroll cost / average).
- [ ] **Salary distribution** chart (histogram bands).
- [ ] **Top earners** table (top 10).

### Insights / reporting panel
- [ ] Preset questions that map to analytics endpoints, e.g.:
      "monthly spend", "highest-cost country", "avg salary by country",
      "top 10 paid", "distribution breakdown".
- [ ] Each question renders the corresponding result (no LLM; direct endpoint calls).

### States & tests
- [ ] Cards/charts handle **loading / empty / error / data** states.
- [ ] Dashboard render test (RTL + MSW) with data and empty state.

---

## Deliverables
- Analytics dashboard with KPIs, charts, top earners, and a reporting panel.

## Definition of Done
- [ ] Dashboard displays correct, USD-normalized figures from the API.
- [ ] Reporting panel answers each preset question correctly.
- [ ] All four UI states handled; dashboard render test passes.

## Suggested commits
- `feat(fe): dashboard KPI cards + by-country chart`
- `feat(fe): distribution + top earners`
- `feat(fe): insights reporting questions`
- `test(fe): dashboard render`
