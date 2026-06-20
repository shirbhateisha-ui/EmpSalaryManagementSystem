# Performance Considerations

> Decisions made to keep the system fast and resource-efficient. Covers both the
> backend (Node.js + SQLite) and the frontend (React + RTK Query).

---

## Backend

### SQLite PRAGMAs

Two PRAGMAs are set at connection startup and are critical to correctness and
throughput:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
```

| PRAGMA               | Effect                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `journal_mode = WAL` | Write-Ahead Logging. Readers do not block writers and writers do not block readers. Multiple concurrent read queries (e.g. analytics + employee list) run in parallel. Without WAL, any write locks the entire file. |
| `foreign_keys = ON`  | SQLite disables FK checks by default. Enabling it prevents orphaned `salaries` rows (employee deleted without cascade) at zero application-code cost.                                                                |

### `v_current_salary` view — query the join once

Every feature that needs the current salary (employee list, employee detail,
analytics) joins through the same view. The correlated subquery:

```sql
SELECT id FROM salaries
WHERE employee_id = e.id
ORDER BY effective_date DESC, id DESC
LIMIT 1
```

is evaluated once per employee per query. An index on `salaries(employee_id,
effective_date DESC, id DESC)` makes this a fast index scan.

**Alternative considered:** denormalise `current_salary_usd` onto the `employees`
row. Faster for sort-by-salary at scale (10 M+ rows), but adds a write to
`employees` on every raise and risks the derived column drifting out of sync.
At 10,000 employees the view is fast enough.

### Analytics aggregations happen in SQL, not in JavaScript

All salary band bucketing, totals, averages, and counts are computed by a single
SQL query per endpoint. The alternative — fetching all rows into Node.js and
grouping in JavaScript — would:

- Transfer up to 10,000 rows over the IPC channel for every analytics request.
- Require allocating and sorting that data in the Node.js process.
- Make the analytics correct only at the moment of fetch (SQL is atomic).

The distribution endpoint uses a `CASE WHEN` expression to assign each employee's
USD salary to a band index (0–5) in a single table scan:

```sql
SELECT
  CASE
    WHEN base_salary_usd < 30000  THEN 0
    WHEN base_salary_usd < 60000  THEN 1
    WHEN base_salary_usd < 90000  THEN 2
    WHEN base_salary_usd < 120000 THEN 3
    WHEN base_salary_usd < 150000 THEN 4
    ELSE 5
  END AS band_index,
  COUNT(*) AS headcount
FROM v_current_salary cs
INNER JOIN employees e ON e.id = cs.employee_id
WHERE e.status = 'active'
GROUP BY band_index;
```

The service layer merges the result into all 6 bands (including zero-headcount
bands). One query, O(n) scan, no round-trips.

### Employee list — server-side filtering, sorting, and pagination

Filtering and sorting are pushed to SQL:

```sql
WHERE e.status = ?
  AND e.country = ?
  AND e.name LIKE ?
ORDER BY e.name ASC
LIMIT ? OFFSET ?
```

This means:

- The response payload is bounded to one page (default 20 rows).
- `LIKE 'term%'` (prefix match) can use the `employees(name)` index.
- Sorting by salary uses the `v_current_salary` join; the index on
  `salaries(employee_id, effective_date DESC)` keeps this fast.

A separate `COUNT(*)` query runs for the pagination meta (`total`, `totalPages`).
Both queries share the same filter bindings.

### `better-sqlite3` synchronous driver

`better-sqlite3` is synchronous. This seems counter-intuitive for Node.js but is
correct here:

- Node.js is single-threaded. An async SQLite driver still serialises writes through
  the event loop.
- Synchronous calls have lower overhead than async — no Promise allocation, no
  microtask scheduling.
- The database is local (in-process file), not a network socket, so there is no
  latency to hide with async I/O.
- Repository code is simpler: `const row = db.prepare(sql).get(id)` instead of
  `const row = await db.get(sql, id)`.

---

## Frontend

### RTK Query caching

All data fetching uses RTK Query, which caches responses by endpoint + argument. The
default `keepUnusedDataFor` is 60 seconds. Practical impact:

- Navigating from the Employees list to a detail page and back does not re-fetch the
  list — the cached result is served instantly.
- The Analytics page re-uses cached summary, country, department, distribution, and
  top-earner data for 60 seconds between visits.
- A "Refresh" button on the Analytics page calls `refetchAll()` which bypasses the
  cache and fetches fresh data on demand.

### Debounced search

The Employees page debounces the search input by 300 ms before updating the RTK
Query argument:

```ts
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
// RTK Query only re-fetches when debouncedSearch changes
const { data } = useListEmployeesQuery({ search: debouncedSearch, ... });
```

A user typing "Engineering" at normal speed generates ~11 keystrokes in ~600 ms.
Without debouncing: 11 requests. With 300 ms debounce: 1–2 requests. At 10,000
rows each request hits SQLite; debouncing reduces server load by ~10×.

### Pagination

The employee list sends `page` and `limit` parameters. The default page size is 20.
This bounds:

- **Network payload:** 20 employee records (with current salary embedded) is ~5–10
  KB of JSON vs ~500 KB for the full 10,000-row dataset.
- **Render cost:** React renders 20 table rows, not 10,000. No virtualisation
  library is needed at this scale.

### Compact number formatting

The Analytics KPI cards use `Intl.NumberFormat` with `notation: 'compact'`:

```ts
const COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
// $4,000,000 → $4M
```

This prevents long numbers from overflowing card layouts without any CSS truncation
hacks. The full-precision formatter (`maximumFractionDigits: 0`) is used in tables
where exact figures matter.

### Code splitting

Vite splits the bundle by route automatically. The Analytics page, Employees pages,
and Users admin page are separate chunks loaded only when the user navigates to them.
The initial login bundle is small: just the auth slice, login page, and Shadcn
components used there.

### No animations

No Framer Motion or CSS transition library is used. Charts, tables, and cards render
statically. This avoids:

- Layout thrash during chart width recalculation.
- Additional JS bundle weight.
- Test complexity (no need to `waitForAnimationEnd`).

---

## Expected Query Times (10,000 employees)

| Operation                           | Mechanism                              | Expected p95 |
| ----------------------------------- | -------------------------------------- | ------------ |
| Employee list (page 1, no filters)  | Index scan on `name ASC`               | < 5 ms       |
| Employee list (filtered + sorted)   | Composite index                        | < 10 ms      |
| Analytics summary                   | Single aggregate query over view       | < 15 ms      |
| Analytics by-country / by-dept      | GROUP BY over view                     | < 15 ms      |
| Salary distribution                 | CASE WHEN + GROUP BY                   | < 10 ms      |
| Top earners                         | ORDER BY base_salary_usd DESC LIMIT 10 | < 5 ms       |
| Employee detail with current salary | PK lookup + view join                  | < 2 ms       |

All measurements assume WAL mode enabled, indexes in place, and the SQLite page
cache warmed after first query.

---

## Bottlenecks to Watch at Higher Scale

| Risk                               | Threshold              | Mitigation                                                                                           |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Sort-by-salary on employee list    | ~100k rows             | Denormalise `current_salary_usd` onto `employees` with an index; update it on every raise            |
| Analytics aggregation over view    | ~500k rows             | Materialise summary with a scheduled background job; cache in a `analytics_snapshot` table           |
| SQLite single writer               | High concurrent writes | Move to PostgreSQL (connection pool) or Turso (libSQL, distributed)                                  |
| Full-table scan on `LIKE '%term%'` | ~50k rows              | Upgrade to SQLite FTS5 (`CREATE VIRTUAL TABLE employees_fts USING fts5`) for prefix and infix search |
