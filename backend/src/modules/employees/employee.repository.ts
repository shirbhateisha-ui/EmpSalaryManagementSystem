import { getDb } from '../../database/connection.js';
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeRecord,
  EmployeeSortField,
  ListEmployeesOptions,
  UpdateEmployeeInput,
} from './employee.types.js';

interface EmployeeRow extends EmployeeRecord {
  salary_id: number | null;
  base_salary: number | null;
  salary_currency_code: string | null;
  effective_date: string | null;
  base_salary_usd: number | null;
}

function mapRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    country: row.country,
    department: row.department,
    currency_code: row.currency_code,
    status: row.status,
    joining_date: row.joining_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    current_salary:
      row.salary_id != null
        ? {
            salary_id: row.salary_id,
            base_salary: row.base_salary!,
            currency_code: row.salary_currency_code!,
            effective_date: row.effective_date!,
            base_salary_usd: row.base_salary_usd!,
          }
        : null,
  };
}

const SORT_MAP: Record<EmployeeSortField, string> = {
  name: 'e.name',
  department: 'e.department',
  country: 'e.country',
  joining_date: 'e.joining_date',
  base_salary_usd: 'COALESCE(cs.base_salary_usd, 0)',
  created_at: 'e.created_at',
};

const SELECT_EMPLOYEE = `
  SELECT
    e.id, e.name, e.email, e.country, e.department, e.currency_code,
    e.status, e.joining_date, e.created_at, e.updated_at,
    cs.salary_id,
    cs.base_salary,
    cs.currency_code AS salary_currency_code,
    cs.effective_date,
    cs.base_salary_usd
  FROM employees e
  LEFT JOIN v_current_salary cs ON cs.employee_id = e.id
`;

export const employeeRepository = {
  list(opts: ListEmployeesOptions): { employees: Employee[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const whereParams: unknown[] = [];

    if (opts.search) {
      const pattern = `%${opts.search}%`;
      conditions.push(
        '(e.name LIKE ? OR e.email LIKE ? OR e.department LIKE ? OR e.country LIKE ?)',
      );
      whereParams.push(pattern, pattern, pattern, pattern);
    }
    if (opts.department) {
      conditions.push('e.department = ?');
      whereParams.push(opts.department);
    }
    if (opts.country) {
      conditions.push('e.country = ?');
      whereParams.push(opts.country);
    }
    if (opts.status) {
      conditions.push('e.status = ?');
      whereParams.push(opts.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = SORT_MAP[opts.sort ?? 'created_at'];
    const sortDir = opts.order === 'asc' ? 'ASC' : 'DESC';

    const countSql = `
      SELECT COUNT(*) AS count
      FROM employees e
      LEFT JOIN v_current_salary cs ON cs.employee_id = e.id
      ${where}
    `;
    const total = (db.prepare(countSql).get(...whereParams) as { count: number }).count;

    const listSql = `
      ${SELECT_EMPLOYEE}
      ${where}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;
    const rows = db
      .prepare(listSql)
      .all(...whereParams, opts.limit, opts.offset) as EmployeeRow[];

    return { employees: rows.map(mapRow), total };
  },

  findById(id: number): Employee | undefined {
    const db = getDb();
    const row = db.prepare(`${SELECT_EMPLOYEE} WHERE e.id = ?`).get(id) as EmployeeRow | undefined;
    return row ? mapRow(row) : undefined;
  },

  findByEmail(email: string): EmployeeRecord | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM employees WHERE email = ?').get(email.toLowerCase()) as
      | EmployeeRecord
      | undefined;
  },

  create(input: CreateEmployeeInput): Employee {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `
        INSERT INTO employees
          (name, email, country, department, currency_code, status, joining_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        input.name,
        input.email.toLowerCase(),
        input.country,
        input.department,
        input.currency_code,
        input.status ?? 'active',
        input.joining_date,
        now,
        now,
      );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error('Failed to create employee');
    return created;
  },

  update(id: number, input: UpdateEmployeeInput): Employee | undefined {
    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(
      `
      UPDATE employees
      SET
        name         = COALESCE(?, name),
        email        = COALESCE(?, email),
        country      = COALESCE(?, country),
        department   = COALESCE(?, department),
        currency_code = COALESCE(?, currency_code),
        status       = COALESCE(?, status),
        joining_date = COALESCE(?, joining_date),
        updated_at   = ?
      WHERE id = ?
    `,
    ).run(
      input.name ?? null,
      input.email ? input.email.toLowerCase() : null,
      input.country ?? null,
      input.department ?? null,
      input.currency_code ?? null,
      input.status ?? null,
      input.joining_date ?? null,
      now,
      id,
    );

    return this.findById(id);
  },
};
