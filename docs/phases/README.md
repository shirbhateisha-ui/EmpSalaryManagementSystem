# Execution Phases — Index

Phase-by-phase build plan for the ACME Salary Management System, matching the
execution + git commit plan in [ARCHITECTURE.md §10](../ARCHITECTURE.md). Each phase
is a self-contained document with a task checklist and a definition of done. Work the
phases in order; later phases assume earlier ones are complete.

Testing is **integrated into each phase** (tests ship with the code they cover), not
deferred to a separate stage.

See also: [REQUIREMENTS.md](../REQUIREMENTS.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

| #   | Phase            | Document                                                         | Outcome                                                                   |
| --- | ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 0   | Foundation       | [PHASE-0-FOUNDATION.md](./PHASE-0-FOUNDATION.md)                 | Monorepo, TS, lint, env, scaffolding                                      |
| 1   | DB & Seed        | [PHASE-1-DB-AND-SEED.md](./PHASE-1-DB-AND-SEED.md)               | Schema (incl. users + refresh_tokens), migrations, view, 10k seed + admin |
| 2   | BE Auth & RBAC   | [PHASE-2-BE-AUTH-RBAC.md](./PHASE-2-BE-AUTH-RBAC.md)             | Login, refresh rotation, RBAC middleware, user management                 |
| 3   | FE Shell         | [PHASE-3-FE-SHELL.md](./PHASE-3-FE-SHELL.md)                     | Layout, store, RTK Query base (token + refresh), routing                  |
| 4   | FE Auth & Guards | [PHASE-4-FE-AUTH-GUARDS.md](./PHASE-4-FE-AUTH-GUARDS.md)         | Login page, auth slice, route/role guards, users admin                    |
| 5   | BE Employees     | [PHASE-5-BE-EMPLOYEES.md](./PHASE-5-BE-EMPLOYEES.md)             | CRUD + search/filter/sort/paginate, clean layers                          |
| 6   | BE Salaries      | [PHASE-6-BE-SALARIES.md](./PHASE-6-BE-SALARIES.md)               | Salary history + raises                                                   |
| 7   | BE Analytics     | [PHASE-7-BE-ANALYTICS.md](./PHASE-7-BE-ANALYTICS.md)             | Aggregation endpoints + currency normalization                            |
| 8   | FE Employees     | [PHASE-8-FE-EMPLOYEES.md](./PHASE-8-FE-EMPLOYEES.md)             | List, detail, create/edit, all 4 states                                   |
| 9   | FE Analytics     | [PHASE-9-FE-ANALYTICS.md](./PHASE-9-FE-ANALYTICS.md)             | Dashboard cards + charts + insights/reporting panel                       |
| 10  | Harden & Deploy  | [PHASE-10-HARDEN-AND-DEPLOY.md](./PHASE-10-HARDEN-AND-DEPLOY.md) | Docs, deploy, persistent SQLite                                           |

## How to use these documents

- Check off `- [ ]` tasks as you complete them.
- Each phase lists **suggested commits** — keep commits small and incremental.
- Do not start a phase until its **Depends on** prerequisites are met.
- A phase is done only when every item under **Definition of Done** is satisfied.
