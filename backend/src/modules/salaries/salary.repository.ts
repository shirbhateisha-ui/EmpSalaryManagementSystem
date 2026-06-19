import { getDb } from '../../database/connection.js';
import type { AddSalaryInput, SalaryRecord } from './salary.types.js';

export const salaryRepository = {
  listByEmployee(employeeId: number): SalaryRecord[] {
    const db = getDb();
    return db
      .prepare(
        `SELECT * FROM salaries WHERE employee_id = ? ORDER BY effective_date DESC, id DESC`,
      )
      .all(employeeId) as SalaryRecord[];
  },

  create(employeeId: number, input: AddSalaryInput): SalaryRecord {
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
      .prepare('SELECT * FROM salaries WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as SalaryRecord;
  },
};
