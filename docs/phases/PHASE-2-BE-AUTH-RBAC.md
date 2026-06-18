# Phase 2 — Backend: Auth & RBAC

**Goal:** Stand up the Express app's auth foundation — secure login, JWT access tokens,
rotating refresh tokens, role-based access control, and Admin user management — before
the domain modules so every later route can be protected.

**Depends on:** [Phase 1 — DB & Seed](./PHASE-1-DB-AND-SEED.md).

**Status:** ✅ Complete — login/refresh/logout/me and Admin user CRUD work; refresh
rotation with reuse detection; RBAC middleware enforced; 9 auth/RBAC tests pass;
`typecheck` and `lint` pass.

> This phase also brings up the cross-cutting infrastructure (envelope, error
> hierarchy, validate middleware) that the domain modules in Phases 5–7 reuse.

---

## Tasks

### App bootstrap & infrastructure

- [x] `app.ts` (Express + middleware wiring) and `server.ts` (listen).
- [x] `config/env.ts` (Zod) including `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
      `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `CORS_ORIGIN`.
- [x] CORS with **credentials enabled**; `helmet`; `rateLimiter`; cookie parser.
- [x] `validate(zodSchema)` middleware; `notFoundHandler`; `errorHandler`.
- [x] Error hierarchy incl. `UnauthorizedError` (401) and `ForbiddenError` (403).
- [x] `response.utils`, `pagination.utils`; `/health` endpoint.

### Security utilities

- [x] `password.utils` — bcrypt hash + compare; password strength rule.
- [x] `jwt.utils` — sign/verify access + refresh tokens.

### Auth module

- [x] `auth.repository` — create/find refresh tokens, revoke, find by hash.
- [x] `auth.service` — login (verify password), issue tokens, **refresh rotation +
      reuse detection**, logout (revoke).
- [x] `auth.validation`, `auth.controller`, `auth.routes`.
- [x] Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
      `GET /auth/me`.
- [x] Set refresh token as `httpOnly`, `secure`, `sameSite` cookie.

### RBAC middleware

- [x] `authenticate` — verify access JWT, attach `req.user`.
- [x] `authorize(...roles)` — enforce role on protected routes.

### Users module (Admin)

- [x] `user.repository`, `user.service` (create with hashed password, update role/status).
- [x] `user.validation`, `user.controller`, `user.routes` (guarded by `authorize('ADMIN')`).
- [x] Endpoints: `GET /users`, `POST /users`, `PATCH /users/:id`.

### Tests

- [x] Login success/failure; password compare.
- [x] Access token verify; protected route rejects missing/expired token (401).
- [x] `authorize` blocks wrong role (403).
- [x] Refresh rotation issues a new token and revokes the old; **reuse detection**
      revokes the session.

---

## Deliverables

- Secure auth with RBAC and Admin user management; reusable infra for later modules.

## Definition of Done

- [x] Login returns an access token + sets a refresh cookie.
- [x] Refresh rotates tokens; reused/revoked tokens are rejected.
- [x] Protected routes require a valid token; role checks return 403 when violated.
- [x] Admin-only user management works; auth + RBAC tests pass.

## Suggested commits

- `feat(be): password + jwt utils`
- `feat(be): auth module (login/refresh/logout/me)`
- `feat(be): authenticate + authorize middleware`
- `feat(be): users module (admin)`
- `test(be): auth + rbac + refresh rotation`
