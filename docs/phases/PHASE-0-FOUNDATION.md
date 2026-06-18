# Phase 0 — Foundation

**Goal:** Establish the monorepo, shared tooling, coding conventions, environment
config, and the empty folder structure for both apps so every later phase has a
consistent base.

**Depends on:** nothing (first phase).

---

## Tasks

### Repository & monorepo
- [ ] Initialize git repository with `main` as the default branch.
- [ ] Create root layout: `frontend/`, `backend/`, `docs/`.
- [ ] Add root `README.md` (overview, prerequisites, run instructions placeholder).
- [ ] Document the package manager (npm) and Node version (`.nvmrc` / `engines`).
- [ ] Configure npm workspaces at the root.

### Tooling & conventions
- [ ] Add root `.gitignore` (node_modules, dist, build, `.env`, `*.db`, coverage).
- [ ] Add `.editorconfig`.
- [ ] Add shared **TypeScript** base config extended by each app.
- [ ] Add **ESLint** + **Prettier** for both apps.
- [ ] Add scripts: `lint`, `format`, `typecheck` (root + per app).
- [ ] Adopt **Conventional Commits**; document the format in the README.

### Backend scaffold
- [ ] Initialize backend (`express + typescript + eslint`) with `tsconfig`.
- [ ] Create skeleton folders per [ARCHITECTURE.md §5](../ARCHITECTURE.md):
      `src/modules`, `routes`, `middleware`, `database`, `shared/errors`,
      `shared/utils`, `config`, `tests`.
- [ ] Add `backend/.env.example` (`PORT`, `DB_PATH`, `CORS_ORIGIN`, `NODE_ENV`).

### Frontend scaffold
- [ ] Scaffold **Vite + React + TypeScript**.
- [ ] Configure **Tailwind CSS** and initialize **Shadcn UI** (`components.json`).
- [ ] Create skeleton folders per [ARCHITECTURE.md §5](../ARCHITECTURE.md):
      `src/app`, `features`, `pages`, `components`, `layouts`, `services`, `hooks`,
      `store`, `types`, `tests`.
- [ ] Add `frontend/.env.example` (`VITE_API_URL`).

---

## Deliverables
- Buildable, lint-clean monorepo with both app skeletons and tooling.

## Definition of Done
- [ ] `npm install` succeeds at the root.
- [ ] `lint`, `format`, `typecheck` run cleanly.
- [ ] Both folder structures match the architecture doc.
- [ ] `frontend` dev server and `backend` start scripts boot (even if empty).

## Suggested commits
- `chore: init monorepo workspaces`
- `chore(be): express+ts+eslint setup`
- `chore(fe): vite+tailwind+shadcn setup`
