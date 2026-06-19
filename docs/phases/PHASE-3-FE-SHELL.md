# Phase 3 — Frontend: Shell

**Goal:** Build the application shell — layout, navigation, Redux store, RTK Query base,
and routing — on top of the Phase 0 Vite/Tailwind/Shadcn scaffold, ready to consume the
live backend API. The base query is **auth-aware** so it can carry tokens once Phase 4
lands the login flow.

**Depends on:** [Phase 0 — Foundation](./PHASE-0-FOUNDATION.md),
[Phase 2 — Backend: Auth & RBAC](./PHASE-2-BE-AUTH-RBAC.md) (live API + auth to call).

**Status:** ✅ Complete — app shell with responsive sidebar, Redux + RTK Query base
(auth-aware refresh-on-401), dashboard health check against live API; `typecheck`, `lint`,
and `build` pass.

---

## Tasks

### State & data layer

- [x] Configure **Redux Toolkit** store in `app/store.ts` with typed `hooks.ts`.
- [x] Add **RTK Query** base API (`services/baseQuery.ts`) reading `VITE_API_URL`,
      sending credentials, **attaching the access token** from state, and
      **refreshing once on a 401** then retrying.
- [x] Add `app/providers.tsx` wrapping Redux `<Provider>` and the router.

### Routing & layout

- [x] Configure **React Router** in `app/router.tsx` with route definitions.
- [x] Build `layouts/AppShell`, `Header`, `Sidebar` with a navigation config.
- [x] Make the layout responsive (sidebar collapses on small screens).

### Shared primitives

- [x] Add base Shadcn components used app-wide (button, card, input, table, skeleton, toast).
- [x] Add reusable **state components**: `LoadingState`, `EmptyState`, `ErrorState`.
- [x] Add shared hooks: `useDebounce`, `useToast`.

### Verification

- [x] App boots, navigation works, and a sample query hits the live API successfully.

---

## Deliverables

- Running frontend shell with routing, layout, store, and RTK Query base wired to the API.

## Definition of Done

- [x] `npm run dev` serves the shell with working navigation.
- [x] Store + RTK Query base configured and typed.
- [x] A live API call (e.g. `/health` or employees list) succeeds from the UI.
- [x] `typecheck` and `lint` pass.

## Suggested commits

- `feat(fe): app shell + sidebar + router`
- `feat(fe): rtk query baseQuery with auth + store`
