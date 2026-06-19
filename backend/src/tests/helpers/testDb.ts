import { closeDb, getDb } from '../../database/connection.js';
import { runMigrations } from '../../database/migrate.js';
import { hashPasswordSync } from '../../shared/utils/password.utils.js';
import type { EmployeeRecord } from '../../modules/employees/employee.types.js';
import type { SalaryRecord } from '../../modules/salaries/salary.types.js';

export function resetTestDatabase(): void {
  closeDb();
  const db = getDb();
  runMigrations();

  db.exec(`
    DELETE FROM refresh_tokens;
    DELETE FROM salaries;
    DELETE FROM employees;
    DELETE FROM users;
    DELETE FROM currencies;
  `);
}

export function seedTestUsers(): {
  admin: { email: string; password: string };
  viewer: { email: string; password: string };
} {
  const db = getDb();
  const now = new Date().toISOString();
  const adminPassword = 'Admin1234';
  const viewerPassword = 'Viewer1234';

  db.prepare(
    `
    INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `,
  ).run('Admin User', 'admin@test.com', hashPasswordSync(adminPassword), 'ADMIN', now, now);

  db.prepare(
    `
    INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `,
  ).run('Viewer User', 'viewer@test.com', hashPasswordSync(viewerPassword), 'VIEWER', now, now);

  return {
    admin: { email: 'admin@test.com', password: adminPassword },
    viewer: { email: 'viewer@test.com', password: viewerPassword },
  };
}

export function seedTestCurrency(code = 'USD', rate = 1.0): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO currencies (code, name, symbol, rate_to_usd) VALUES (?, ?, ?, ?)`,
  ).run(code, code === 'USD' ? 'US Dollar' : code, code === 'USD' ? '$' : code, rate);
}

export function seedTestEmployee(
  override: Partial<Omit<EmployeeRecord, 'id' | 'created_at' | 'updated_at'>> = {},
): EmployeeRecord & { id: number } {
  const db = getDb();
  const now = new Date().toISOString();
  const data = {
    name: override.name ?? 'Test Employee',
    email: override.email ?? 'employee@test.com',
    country: override.country ?? 'US',
    department: override.department ?? 'Engineering',
    currency_code: override.currency_code ?? 'USD',
    status: override.status ?? 'active',
    joining_date: override.joining_date ?? '2024-01-01',
  };

  const result = db
    .prepare(
      `INSERT INTO employees (name, email, country, department, currency_code, status, joining_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.name,
      data.email.toLowerCase(),
      data.country,
      data.department,
      data.currency_code,
      data.status,
      data.joining_date,
      now,
      now,
    );

  return { id: Number(result.lastInsertRowid), ...data, created_at: now, updated_at: now };
}

export function seedTestSalary(
  employeeId: number,
  override: Partial<Omit<SalaryRecord, 'id' | 'employee_id' | 'created_at'>> = {},
): SalaryRecord & { id: number } {
  const db = getDb();
  const now = new Date().toISOString();
  const data = {
    base_salary: override.base_salary ?? 50000,
    currency_code: override.currency_code ?? 'USD',
    country: override.country ?? 'US',
    effective_date: override.effective_date ?? '2024-01-01',
  };

  const result = db
    .prepare(
      `INSERT INTO salaries (employee_id, base_salary, currency_code, country, effective_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(employeeId, data.base_salary, data.currency_code, data.country, data.effective_date, now);

  return { id: Number(result.lastInsertRowid), employee_id: employeeId, ...data, created_at: now };
}

export function extractRefreshCookie(cookies: string | string[] | undefined): string {
  const header = Array.isArray(cookies) ? cookies.join('; ') : (cookies ?? '');
  const match = /refresh_token=([^;]+)/.exec(header);
  if (!match) {
    throw new Error('Refresh token cookie not found');
  }
  return decodeURIComponent(match[1]);
}
