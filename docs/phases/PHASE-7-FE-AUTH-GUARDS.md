# Phase 7 — Frontend: Auth & Guards

**Goal:** Deliver the login experience and client-side access control — an auth slice,
login page, route/role guards, a user menu with logout, and the Admin users screen.

**Depends on:** [Phase 6 — Frontend: Shell](./PHASE-6-FE-SHELL.md),
[Phase 2 — Backend: Auth & RBAC](./PHASE-2-BE-AUTH-RBAC.md).

> Client guards are **UX only** — the backend is the real enforcement point. Guards
> prevent showing screens/actions a role can't use and redirect unauthenticated users.

---

## Tasks

### Auth feature

- [ ] `features/auth` with `api/`, `components/`, `pages/`, `store/`, `types/`.
- [ ] RTK Query `auth.api` (login, refresh, logout, me).
- [ ] **Auth slice** holding access token + current user + status; persist enough to
      restore the session (refresh cookie does the heavy lifting).
- [ ] `useAuth` hook exposing user, role, and `isAuthenticated`.

### Login & session

- [ ] Login page + `LoginForm` (Shadcn + Zod) with error handling.
- [ ] On load, attempt `refresh` / `me` to restore an existing session.
- [ ] Header **user menu** with logout (calls `/auth/logout`, clears state).

### Guards & routing

- [ ] `AuthGuard` — redirect unauthenticated users to `/login`.
- [ ] `RoleGuard` — block routes/actions by role; hide nav items the role can't access.
- [ ] Wrap protected routes; mark `/login` public.

### Users admin (Admin only)

- [ ] `features/users` screen: list users, create user + assign role, deactivate.
- [ ] Gate the screen and its nav entry behind `RoleGuard('ADMIN')`.

### States & tests

- [ ] Login handles **loading / error** states; invalid credentials surface a message.
- [ ] Tests: login success/failure flow; `AuthGuard` redirect; `RoleGuard` hides/blocks;
      logout clears state.

---

## Deliverables

- Working login, session restore, logout, route/role guards, and Admin user management.

## Definition of Done

- [ ] Unauthenticated users are redirected to login; valid login lands in the app.
- [ ] Expired access token is transparently refreshed (via Phase 6 baseQuery).
- [ ] Role-restricted screens/actions are hidden/blocked for the wrong role.
- [ ] Admin can manage users; auth flow + guard tests pass.

## Suggested commits

- `feat(fe): auth slice + login page`
- `feat(fe): AuthGuard + RoleGuard`
- `feat(fe): users admin screen`
- `test(fe): auth flow + guards`
