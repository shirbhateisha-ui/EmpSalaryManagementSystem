# Phase 2 — Backend: Auth & RBAC

**Goal:** Stand up the Express app's auth foundation — secure login, JWT access tokens,
rotating refresh tokens, role-based access control, and Admin user management — before
the domain modules so every later route can be protected.

**Depends on:** [Phase 1 — DB & Seed](./PHASE-1-DB-AND-SEED.md).

> This phase also brings up the cross-cutting infrastructure (envelope, error
> hierarchy, validate middleware) that the domain modules in Phases 3–5 reuse.

---

## Tasks

### App bootstrap & infrastructure
- [ ] `app.ts` (Express + middleware wiring) and `server.ts` (listen).
- [ ] `config/env.ts` (Zod) including `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`,
      `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `CORS_ORIGIN`.
- [ ] CORS with **credentials enabled**; `helmet`; `rateLimiter`; cookie parser.
- [ ] `validate(zodSchema)` middleware; `notFoundHandler`; `errorHandler`.
- [ ] Error hierarchy incl. `UnauthorizedError` (401) and `ForbiddenError` (403).
- [ ] `response.utils`, `pagination.utils`; `/health` endpoint.

### Security utilities
- [ ] `password.utils` — bcrypt hash + compare; password strength rule.
- [ ] `jwt.utils` — sign/verify access + refresh tokens.

### Auth module
- [ ] `auth.repository` — create/find refresh tokens, revoke, find by hash.
- [ ] `auth.service` — login (verify password), issue tokens, **refresh rotation +
      reuse detection**, logout (revoke).
- [ ] `auth.validation`, `auth.controller`, `auth.routes`.
- [ ] Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
      `GET /auth/me`.
- [ ] Set refresh token as `httpOnly`, `secure`, `sameSite` cookie.

### RBAC middleware
- [ ] `authenticate` — verify access JWT, attach `req.user`.
- [ ] `authorize(...roles)` — enforce role on protected routes.

### Users module (Admin)
- [ ] `user.repository`, `user.service` (create with hashed password, update role/status).
- [ ] `user.validation`, `user.controller`, `user.routes` (guarded by `authorize('ADMIN')`).
- [ ] Endpoints: `GET /users`, `POST /users`, `PATCH /users/:id`.

### Tests
- [ ] Login success/failure; password compare.
- [ ] Access token verify; protected route rejects missing/expired token (401).
- [ ] `authorize` blocks wrong role (403).
- [ ] Refresh rotation issues a new token and revokes the old; **reuse detection**
      revokes the session.

---

## Deliverables
- Secure auth with RBAC and Admin user management; reusable infra for later modules.

## Definition of Done
- [ ] Login returns an access token + sets a refresh cookie.
- [ ] Refresh rotates tokens; reused/revoked tokens are rejected.
- [ ] Protected routes require a valid token; role checks return 403 when violated.
- [ ] Admin-only user management works; auth + RBAC tests pass.

## Suggested commits
- `feat(be): password + jwt utils`
- `feat(be): auth module (login/refresh/logout/me)`
- `feat(be): authenticate + authorize middleware`
- `feat(be): users module (admin)`
- `test(be): auth + rbac + refresh rotation`
