import { getDb } from '../../database/connection.js';
import type { CountryPayroll, DepartmentPayroll, TopEarner } from './analytics.types.js';

const ACTIVE_EMPLOYEES_JOIN = `
  FROM v_current_salary cs
  INNER JOIN employees e ON e.id = cs.employee_id
  WHERE e.status = 'active'
`;

export const analyticsRepository = {
  summary(): {
    headcount: number;
    total_annual_usd: number;
    avg_annual_usd: number;
    min_annual_usd: number;
    max_annual_usd: number;
  } {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        COUNT(*)                              AS headcount,
        COALESCE(SUM(cs.base_salary_usd), 0) AS total_annual_usd,
        COALESCE(AVG(cs.base_salary_usd), 0) AS avg_annual_usd,
        COALESCE(MIN(cs.base_salary_usd), 0) AS min_annual_usd,
        COALESCE(MAX(cs.base_salary_usd), 0) AS max_annual_usd
      ${ACTIVE_EMPLOYEES_JOIN}
    `,
      )
      .get() as ReturnType<typeof analyticsRepository.summary>;
  },

  byCountry(): CountryPayroll[] {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        e.country,
        COUNT(*)                AS headcount,
        SUM(cs.base_salary_usd) AS total_annual_usd,
        AVG(cs.base_salary_usd) AS avg_annual_usd
      ${ACTIVE_EMPLOYEES_JOIN}
      GROUP BY e.country
      ORDER BY total_annual_usd DESC
    `,
      )
      .all() as CountryPayroll[];
  },

  byDepartment(): DepartmentPayroll[] {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        e.department,
        COUNT(*)                AS headcount,
        SUM(cs.base_salary_usd) AS total_annual_usd,
        AVG(cs.base_salary_usd) AS avg_annual_usd
      ${ACTIVE_EMPLOYEES_JOIN}
      GROUP BY e.department
      ORDER BY total_annual_usd DESC
    `,
      )
      .all() as DepartmentPayroll[];
  },

  distributionCounts(): { band_index: number; headcount: number }[] {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        CASE
          WHEN cs.base_salary_usd <  30000 THEN 0
          WHEN cs.base_salary_usd <  60000 THEN 1
          WHEN cs.base_salary_usd <  90000 THEN 2
          WHEN cs.base_salary_usd < 120000 THEN 3
          WHEN cs.base_salary_usd < 150000 THEN 4
          ELSE 5
        END AS band_index,
        COUNT(*) AS headcount
      ${ACTIVE_EMPLOYEES_JOIN}
      GROUP BY band_index
      ORDER BY band_index
    `,
      )
      .all() as { band_index: number; headcount: number }[];
  },

  topEarners(limit: number): TopEarner[] {
    const db = getDb();
    return db
      .prepare(
        `
      SELECT
        e.id,
        e.name,
        e.department,
        e.country,
        cs.base_salary_usd        AS annual_usd,
        cs.base_salary_usd / 12.0 AS monthly_usd
      ${ACTIVE_EMPLOYEES_JOIN}
      ORDER BY cs.base_salary_usd DESC
      LIMIT ?
    `,
      )
      .all(limit) as TopEarner[];
  },
};
