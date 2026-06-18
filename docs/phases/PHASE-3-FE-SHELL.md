# Phase 3 — Frontend: Shell

**Goal:** Build the application shell — layout, navigation, Redux store, RTK Query base,
and routing — on top of the Phase 0 Vite/Tailwind/Shadcn scaffold, ready to consume the
live backend API. The base query is **auth-aware** so it can carry tokens once Phase 4
lands the login flow.

**Depends on:** [Phase 0 — Foundation](./PHASE-0-FOUNDATION.md),
[Phase 2 — Backend: Auth & RBAC](./PHASE-2-BE-AUTH-RBAC.md) (live API + auth to call).

---

## Tasks

### State & data layer

- [ ] Configure **Redux Toolkit** store in `app/store.ts` with typed `hooks.ts`.
- [ ] Add **RTK Query** base API (`services/baseQuery.ts`) reading `VITE_API_URL`,
      sending credentials, **attaching the access token** from state, and
      **refreshing once on a 401** then retrying.
- [ ] Add `app/providers.tsx` wrapping Redux `<Provider>` and the router.

### Routing & layout

- [ ] Configure **React Router** in `app/router.tsx` with route definitions.
- [ ] Build `layouts/AppShell`, `Header`, `Sidebar` with a navigation config.
- [ ] Make the layout responsive (sidebar collapses on small screens).

### Shared primitives

- [ ] Add base Shadcn components used app-wide (button, card, input, table, skeleton, toast).
- [ ] Add reusable **state components**: `LoadingState`, `EmptyState`, `ErrorState`.
- [ ] Add shared hooks: `useDebounce`, `useToast`.

### Verification

- [ ] App boots, navigation works, and a sample query hits the live API successfully.

---

## Deliverables

- Running frontend shell with routing, layout, store, and RTK Query base wired to the API.

## Definition of Done

- [ ] `npm run dev` serves the shell with working navigation.
- [ ] Store + RTK Query base configured and typed.
- [ ] A live API call (e.g. `/health` or employees list) succeeds from the UI.
- [ ] `typecheck` and `lint` pass.

## Suggested commits

- `feat(fe): app shell + sidebar + router`
- `feat(fe): rtk query baseQuery with auth + store`
