# Phase 10 — Harden & Deploy

**Goal:** Finalize documentation, deploy a fully functional product (frontend on
Vercel, backend on Render with **persistent SQLite**), and verify data survives
redeploys.

**Depends on:** all prior phases (0–9).

> Critical risk: Render/Railway default filesystems are **ephemeral** — the SQLite
> file is wiped on every redeploy. This phase must solve persistence.

---

## Tasks

### Hardening

- [ ] Final pass on error/empty/loading states across all screens.
- [ ] Confirm `lint`, `typecheck`, and the full test suite pass.
- [ ] Lock backend CORS to the exact Vercel origin **with credentials**; confirm
      `helmet` + rate limiting on.
- [ ] Confirm refresh cookie flags in prod (`httpOnly`, `secure`, `sameSite`).
- [ ] Ensure no secrets are committed; all config (incl. token secrets) via env.

### Documentation

- [ ] Update root `README.md`: overview, local setup, scripts, env vars, live URLs.
- [ ] Confirm `docs/REQUIREMENTS.md` and `docs/ARCHITECTURE.md` are current.

### Backend — Render

- [ ] Create a Render **Web Service** for the backend.
- [ ] Attach a **Persistent Disk**, mount the DB at `/data/app.db`, set `DB_PATH`.
- [ ] Run **migrations** on boot; run **seed once** (idempotent guard) if empty,
      creating the initial Admin user.
- [ ] Set env: `NODE_ENV=production`, `PORT`, `DB_PATH`, `CORS_ORIGIN`,
      `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_TTL`,
      `REFRESH_TOKEN_TTL`, initial admin credentials.
- [ ] Confirm `/health` returns ok and login works on the deployed URL.

> Persistence alternatives if a disk is unavailable: **Turso/libSQL**, **Fly.io
> volume**, or **LiteFS**. Decide before first deploy.

### Frontend — Vercel

- [ ] Import the repo; set the frontend root and build command.
- [ ] Set `VITE_API_URL` to the deployed backend URL.
- [ ] Configure SPA rewrite (all routes → `index.html`).

### Verification

- [ ] Production smoke test: **log in**, list/search/filter employees, view detail +
      history, create employee, view dashboard analytics, **log out**.
- [ ] Verify RBAC in prod: a Viewer cannot perform writes; Admin can manage users.
- [ ] Confirm seed data **survives a redeploy** (persistence works).

---

## Deliverables

- Publicly accessible, connected frontend + backend with persistent data and docs.

## Definition of Done

- [ ] Frontend (Vercel) and backend (Render) are live and connected.
- [ ] 10k seed data is present and **persists across redeploys**.
- [ ] All core flows work end-to-end in production.
- [ ] README documents URLs, environment variables, and deploy steps.

## Suggested commits

- `docs: README + architecture + requirements`
- `chore: deploy config (vercel+render+disk+auth secrets)`
- `chore: idempotent seed guard`
