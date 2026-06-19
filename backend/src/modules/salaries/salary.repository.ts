import { getDb } from '../../database/connection.js';
import type { AddSalaryInput, SalaryWithUsd } from './salary.types.js';

// Selects a salary row joined to its currency, exposing base_salary_usd
// (base_salary * rate_to_usd) — mirrors the v_current_salary view.
const SALARY_WITH_USD = `
  SELECT
    s.id,
    s.employee_id,
    s.base_salary,
    s.currency_code,
    s.country,
    s.effective_date,
    s.created_at,
    s.base_salary * c.rate_to_usd AS base_salary_usd
  FROM salaries s
  INNER JOIN currencies c ON c.code = s.currency_code
`;

export const salaryRepository = {
  listByEmployee(employeeId: number): SalaryWithUsd[] {
    const db = getDb();
    return db
      .prepare(
        `${SALARY_WITH_USD} WHERE s.employee_id = ? ORDER BY s.effective_date DESC, s.id DESC`,
      )
      .all(employeeId) as SalaryWithUsd[];
  },

  create(employeeId: number, input: AddSalaryInput): SalaryWithUsd {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO salaries (employee_id, base_salary, currency_code, country, effective_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        employeeId,
        input.base_salary,
        input.currency_code.toUpperCase(),
        input.country,
        input.effective_date,
        now,
      );

    return db
      .prepare(`${SALARY_WITH_USD} WHERE s.id = ?`)
      .get(Number(result.lastInsertRowid)) as SalaryWithUsd;
  },
};
