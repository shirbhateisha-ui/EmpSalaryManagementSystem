# Contributing

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`.

**Scopes:** `be` (backend), `fe` (frontend), `db` (database/seed), or omit for
repo-wide changes.

Examples:

```
chore: init monorepo workspaces
feat(be): employee repository (sql)
feat(fe): employees table + filters + pagination
test(be): aggregation correctness fixtures
docs: add requirements and architecture design
```

Keep commits **small and incremental** — one logical change per commit. Each
[execution phase](docs/phases/README.md) lists its representative commits.

## Branching

Create a feature branch per phase (e.g. `phase-0-foundation`); do not commit directly
to `main`.

## Before committing

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
```
