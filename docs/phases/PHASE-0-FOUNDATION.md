# Phase 0 — Foundation

**Goal:** Establish the monorepo, shared tooling, coding conventions, environment
config, and the empty folder structure for both apps so every later phase has a
consistent base.

**Depends on:** nothing (first phase).

**Status:** ✅ Complete — `npm install`, `typecheck`, `lint`, `format:check` all pass;
backend boots with `/health` returning `{"status":"ok"}`; frontend production build
compiles. Built on branch `phase-0-foundation`.

---

## Tasks

### Repository & monorepo

- [x] Initialize git repository with `main` as the default branch.
- [x] Create root layout: `frontend/`, `backend/`, `docs/`.
- [x] Add root `README.md` (overview, prerequisites, run instructions placeholder).
- [x] Document the package manager (npm) and Node version (`.nvmrc` / `engines`).
- [x] Configure npm workspaces at the root.

### Tooling & conventions

- [x] Add root `.gitignore` (node_modules, dist, build, `.env`, `*.db`, coverage).
- [x] Add `.editorconfig`.
- [x] Add shared **TypeScript** base config extended by each app.
- [x] Add **ESLint** + **Prettier** for both apps.
- [x] Add scripts: `lint`, `format`, `typecheck` (root + per app).
- [x] Adopt **Conventional Commits**; document the format in the README.

### Backend scaffold

- [x] Initialize backend (`express + typescript + eslint`) with `tsconfig`.
- [x] Create skeleton folders per [ARCHITECTURE.md §5](../ARCHITECTURE.md): `src/modules`,
      `routes`, `middleware`, `database`, `shared/errors`, `shared/utils`, `config`, `tests`.
- [x] Add `backend/.env.example` (`PORT`, `DB_PATH`, `CORS_ORIGIN`, `NODE_ENV`).

### Frontend scaffold

- [x] Scaffold **Vite + React + TypeScript**.
- [x] Configure **Tailwind CSS** and initialize **Shadcn UI** (`components.json`).
- [x] Create skeleton folders per [ARCHITECTURE.md §5](../ARCHITECTURE.md): `src/app`,
      `features`, `pages`, `components`, `layouts`, `services`, `hooks`, `store`, `types`,
      `tests`.
- [x] Add `frontend/.env.example` (`VITE_API_URL`).

---

## Deliverables

- Buildable, lint-clean monorepo with both app skeletons and tooling.

## Definition of Done

- [x] `npm install` succeeds at the root.
- [x] `lint`, `format`, `typecheck` run cleanly.
- [x] Both folder structures match the architecture doc.
- [x] `frontend` dev server and `backend` start scripts boot (even if empty).

## Suggested commits

- `chore: init monorepo workspaces`
- `chore(be): express+ts+eslint setup`
- `chore(fe): vite+tailwind+shadcn setup`
