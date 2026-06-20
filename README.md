# ACME Salary Management

Employee Salary Management System for an organization with ~10,000 employees across
multiple countries. Replaces Excel-based salary tracking with web software for the HR
team.

> Planning docs: [Requirements](docs/REQUIREMENTS.md) ·
> [Architecture](docs/ARCHITECTURE.md) · [Execution phases](docs/phases/README.md)

## Tech stack

| Layer    | Stack                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Backend  | Node.js, TypeScript, Express, SQLite (better-sqlite3)                      |
| Frontend | React, Vite, TypeScript, Tailwind CSS, Redux Toolkit, RTK Query, Shadcn UI |
| Testing  | Vitest, React Testing Library, supertest, MSW                              |
| Deploy   | Vercel (frontend), Render (backend) with persistent disk                   |

## Monorepo layout

```
.
├─ backend/    Express + TypeScript API
├─ frontend/   React + Vite app
└─ docs/       Requirements, architecture, phase plans
```

This repo uses **npm workspaces** — install once at the root and it installs both apps.

## Prerequisites

- **Node.js >= 20** (see [.nvmrc](.nvmrc); developed on Node 24). Check with `node -v`.
- **npm >= 9** (ships with Node). Check with `npm -v`.
- **git**

## Setup

From the repository root:

```bash
# 1. Install all workspace dependencies (root + backend + frontend)
npm install
```

Then create local env files from the templates.

**macOS / Linux / Git Bash:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Windows PowerShell:**

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Default env values work out of the box for local development:

| File            | Variable       | Default                        | Purpose                   |
| --------------- | -------------- | ------------------------------ | ------------------------- |
| `backend/.env`  | `PORT`         | `4000`                         | Backend HTTP port         |
| `backend/.env`  | `CORS_ORIGIN`  | `http://localhost:5173`        | Allowed frontend origin   |
| `backend/.env`  | `DB_PATH`      | `./data/app.db`                | SQLite database file path |
| `frontend/.env` | `VITE_API_URL` | `http://localhost:4000/api/v1` | Backend API base URL      |

## Database setup

The app uses **SQLite** via `better-sqlite3` — there is **no database server to install
or run**. The database is a single file at `backend/data/app.db` (configurable via
`DB_PATH`). WAL mode and foreign-key enforcement are enabled automatically on every
connection.

### First-time setup

After installing dependencies and creating `backend/.env`, build and populate the
database with one command from the repository root:

```bash
npm run db:seed -w backend
```

This **runs the migrations first**, then seeds the data — so it's all you need to go
from nothing to a ready database. It creates:

- All tables (`currencies`, `employees`, `salaries`, `users`, `refresh_tokens`) and the
  `v_current_salary` view
- 7 seeded currencies with USD exchange rates
- The admin user (credentials from `backend/.env` — defaults `admin@acme.com` / `i`)
- 10,000 fake employees with salary history

The `backend/data/` directory is created automatically. Seeding is **idempotent** — it
skips employee seeding if the database is already populated.

### Database scripts

Run from the repository root:

| Script                          | Purpose                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run db:migrate -w backend` | Apply pending SQL migrations only (schema + view). Tracked in a `_migrations` table, so it's safe to re-run. |
| `npm run db:seed -w backend`    | Run migrations, then seed currencies, the admin user, and 10,000 employees. Idempotent.                      |
| `npm run db:reset -w backend`   | Clear seed data and re-seed from scratch.                                                                    |

### Start over from a clean slate

Delete the database file and its WAL/SHM sidecars, then re-seed:

```bash
# macOS / Linux / Git Bash
rm -f backend/data/app.db backend/data/app.db-wal backend/data/app.db-shm
npm run db:seed -w backend
```

```powershell
# Windows PowerShell
Remove-Item backend\data\app.db, backend\data\app.db-wal, backend\data\app.db-shm -ErrorAction SilentlyContinue
npm run db:seed -w backend
```

> Only delete these files while the backend and any SQLite viewer are **stopped** —
> removing them while a connection is open can corrupt state.

## Run locally

From the repository root, start **both apps with one command** (they run in parallel
via `concurrently`, with labeled `[backend]` / `[frontend]` output):

```bash
npm run dev
```

- Backend → http://localhost:4000
- Frontend → http://localhost:5173

Then open **http://localhost:5173** in your browser. Press `Ctrl+C` to stop both.

### Run them separately (optional)

If you prefer one app per terminal:

```bash
npm run dev -w backend     # backend only (http://localhost:4000)
npm run dev -w frontend    # frontend only (http://localhost:5173)
```

### Verify it's working

```bash
# Backend health check — should return {"status":"ok"}
curl http://localhost:4000/health
```

The frontend shows a Phase 0 placeholder screen confirming React + Tailwind are wired
up. Feature screens (employees, analytics) arrive in later phases — see
[docs/phases](docs/phases/README.md).

## Scripts

Run from the root to target all workspaces, or add `-w backend` / `-w frontend` to
target one.

| Script                          | Purpose                               |
| ------------------------------- | ------------------------------------- |
| `npm run dev`                   | Start **both** dev servers (parallel) |
| `npm run build`                 | Production build                      |
| `npm run lint`                  | Lint with ESLint                      |
| `npm run typecheck`             | Type-check with `tsc`                 |
| `npm run format`                | Format the repo with Prettier         |
| `npm run format:check`          | Check formatting without writing      |
| `npm test`                      | Run tests (Vitest)                    |
| `npm run db:migrate -w backend` | Apply pending DB migrations           |
| `npm run db:seed -w backend`    | Migrate + seed the database           |
| `npm run db:reset -w backend`   | Reset and re-seed the database        |

Example — type-check just the frontend: `npm run typecheck -w frontend`.

## Production build

```bash
npm run build            # builds both workspaces
npm run start -w backend # serve the compiled backend (dist/server.js)
npm run preview -w frontend # preview the built frontend
```

## Troubleshooting

- **Port already in use:** change `PORT` in `backend/.env` (and `CORS_ORIGIN` to match
  the frontend) or Vite's port via `frontend/vite.config.ts`.
- **Frontend can't reach the API:** ensure the backend is running and `VITE_API_URL`
  in `frontend/.env` matches the backend URL. Restart the Vite dev server after
  changing env files.
- **Fresh install issues:** delete `node_modules` and `package-lock.json` at the root,
  then run `npm install` again.

## Conventions

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit message conventions (Conventional
Commits) and the branching model.

## Status

Built incrementally by phase — see [docs/phases](docs/phases/README.md).
Current: **Phase 0 — Foundation** complete (monorepo, tooling, scaffolding).
