# ACME Salary Management — Requirements Document

> One-page product + scope definition for the Employee Salary Management System.
> Primary user: **HR Manager**. Scale target: **~10,000 employees** across multiple countries.

---

## 1. Problem

ACME's HR team manages salary data for ~10,000 employees across multiple countries
entirely in Excel. This is tedious, error-prone, hard to query, and impossible to
audit. We want a web-based tool that lets the HR Manager manage employee and salary
data and **answer questions about how the organization pays people** — without
spreadsheets.

## 2. Goal

Replace the Excel workflow with web software that supports fast employee/salary
management and a reporting dashboard that answers payroll questions
("What do we spend monthly?", "Which country costs the most?") using deterministic
SQL aggregations.

## 3. Users & Roles

**HR Manager** is the primary user. Access is governed by **role-based access control
(RBAC)** with three roles:

| Role           | Capabilities                                                                     |
| -------------- | -------------------------------------------------------------------------------- |
| **Admin**      | Everything, plus **user management** (create/deactivate users, assign roles).    |
| **HR Manager** | Manage employees & salaries (create/update), view analytics. No user management. |
| **Viewer**     | Read-only: view employees and analytics. No edits.                               |

## 4. In Scope

**Authentication & Access Control**

- Email + password **login** with securely hashed passwords (bcrypt/argon2).
- **JWT access tokens** (short-lived) for API authorization, sent per request.
- **Refresh tokens** (long-lived, httpOnly secure cookie) with **rotation** and
  server-side revocation, so sessions can be invalidated.
- **Role-based access control** (Admin / HR Manager / Viewer) enforced on the API and
  reflected in the UI (route guards, conditional actions).
- **User management** (Admin only): create users, assign roles, deactivate.

**Employee Management**

- Create, update, view employees.
- Search (by name/email), filter (country, department, status), sort, paginate —
  performant over 10,000 rows.

**Salary Management**

- Base salary, currency, country, effective date.
- **Full salary history** per employee. A raise creates a _new_ salary record;
  nothing is overwritten. "Current salary" = latest effective record.
- **Multi-currency normalization** to a base reporting currency (USD) so totals
  across countries are meaningful.

**Analytics Dashboard**

- Total payroll (annual + monthly), average / highest / lowest salary, headcount.
- Payroll and average salary **by country** and **by department**.
- **Salary distribution** (histogram bands).
- **Top-N highest paid** employees.

**Reporting / Insights (deterministic SQL, no LLM)**

- The dashboard answers the HR Manager's common payroll questions directly through
  analytics endpoints — there is no AI/LLM inside the application. Examples:
  - "How much do we spend monthly?" → summary
  - "Which country has the highest payroll cost?" → by-country
  - "What is the average salary by country?" → by-country
  - "Top 10 highest paid employees?" → top-earners
  - "Salary distribution breakdown?" → distribution

**Seed Data**

- Script generating 10,000 employees with realistic name, email, country,
  department, currency, salary, joining date.

## 5. Out of Scope (and why)

| Excluded                                                                   | Reasoning                                                                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **LLM-based Q&A**                                                          | Assessment requires SQL aggregations. Deterministic answers are auditable, free, correct, and testable. The API is designed so an LLM→SQL layer could slot in later behind the same endpoints.         |
| **Multi-tenant orgs, SSO, MFA, social login**                              | One organization with managed email/password sign-in. Enterprise SSO, multi-factor, and social providers add integration surface beyond this assessment; the RBAC model leaves room to add them later. |
| **Payroll _execution_** (payslips, tax, deductions, net pay, disbursement) | This is a _management & reporting_ tool, not a payroll engine. Net/tax requires per-country compliance — a multi-month effort.                                                                         |
| **Live FX rates**                                                          | Exchange rates are a seeded/config table, not a live integration. Keeps analytics deterministic and testable; pluggable later.                                                                         |
| **Bulk Excel import/export**                                               | Seed replaces import. CSV export is a fast-follow, not core.                                                                                                                                           |
| **Real-time / websockets / notifications / approval workflows**            | No collaborative or multi-user editing need for a single operator.                                                                                                                                     |

## 6. Non-Functional Requirements

- **Performance:** sub-200ms filtered + paginated listing over 10,000 rows.
- **Correctness:** cross-currency aggregates verified against hand-computed fixtures.
- **UX:** responsive UI; explicit **loading / empty / error / data** states everywhere.
- **Robustness:** centralized error handling; validated inputs (Zod).
- **Quality:** tested service, repository, and component layers; maintainable,
  feature-based structure.
- **Deployability:** fully deployed frontend + backend with persistent SQLite.

## 7. Success Criteria

1. HR can create/search/filter/sort/paginate 10k employees fluidly.
2. Salary history is preserved; raises are additive.
3. Dashboard totals are correct across mixed currencies (normalized to USD).
4. Dashboard reporting answers the HR Manager's payroll questions with correct,
   deterministic results.
5. Users authenticate securely; roles correctly gate API actions and UI; refresh-token
   rotation keeps sessions valid and revocable.
6. Software is deployed end-to-end with a persisted database.
7. Git history is incremental and shows how the solution evolved.

## 8. Key Definitions

- **Base salary unit:** stored as **annual gross**. Monthly spend = annual / 12.
- **Reporting currency:** **USD**. All cross-entity totals convert via
  `currencies.rate_to_usd`.
- **Current salary:** the salary record with the latest `effective_date` for an
  employee (exposed via the `v_current_salary` view).
- **Access token:** short-lived JWT (~15 min) sent on each API request to authorize it.
- **Refresh token:** long-lived (~7 day) credential stored in an httpOnly secure cookie;
  rotated on use and revocable server-side to end a session.
- **Roles:** `ADMIN`, `HR_MANAGER`, `VIEWER` — enforced by the API and the UI.
