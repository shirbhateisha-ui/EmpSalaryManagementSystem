import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { closeDb, getDb } from './connection.js';
import { runMigrations } from './migrate.js';

const TARGET_EMPLOYEE_COUNT = 10_000;
const BCRYPT_ROUNDS = 12;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate_to_usd: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate_to_usd: 1.08 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate_to_usd: 1.27 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate_to_usd: 0.012 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate_to_usd: 0.65 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate_to_usd: 0.74 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate_to_usd: 0.0067 },
] as const;

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Sales',
  'Marketing',
  'Operations',
  'Customer Support',
  'Legal',
  'Product',
  'IT',
] as const;

const COUNTRY_CURRENCY: Record<string, string> = {
  'United States': 'USD',
  'United Kingdom': 'GBP',
  Germany: 'EUR',
  France: 'EUR',
  India: 'INR',
  Australia: 'AUD',
  Canada: 'CAD',
  Japan: 'JPY',
};

const COUNTRIES = Object.keys(COUNTRY_CURRENCY);

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function randomSalaryForCurrency(currencyCode: string): number {
  const ranges: Record<string, [number, number]> = {
    USD: [45_000, 180_000],
    EUR: [40_000, 160_000],
    GBP: [35_000, 150_000],
    INR: [600_000, 3_500_000],
    AUD: [55_000, 190_000],
    CAD: [50_000, 170_000],
    JPY: [4_000_000, 18_000_000],
  };
  const [min, max] = ranges[currencyCode] ?? [40_000, 150_000];
  return Math.round(faker.number.float({ min, max, fractionDigits: 0 }) / 100) * 100;
}

function seedCurrencies(): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO currencies (code, name, symbol, rate_to_usd)
    VALUES (@code, @name, @symbol, @rate_to_usd)
  `);

  const seed = db.transaction(() => {
    for (const currency of CURRENCIES) {
      insert.run(currency);
    }
  });

  seed();
}

function seedAdminUser(): void {
  const db = getDb();
  const passwordHash = bcrypt.hashSync(env.adminPassword, BCRYPT_ROUNDS);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, 'ADMIN', 'active', ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      password_hash = excluded.password_hash,
      role = excluded.role,
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run(env.adminName, env.adminEmail, passwordHash, now, now);
}

function clearSeedData(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM refresh_tokens;
    DELETE FROM salaries;
    DELETE FROM employees;
    DELETE FROM users;
    DELETE FROM currencies;
  `);
}

function seedEmployeesAndSalaries(): void {
  const db = getDb();
  const insertEmployee = db.prepare(`
    INSERT INTO employees (
      name, email, country, department, currency_code, status, joining_date, created_at, updated_at
    ) VALUES (
      @name, @email, @country, @department, @currency_code, @status, @joining_date, @created_at, @updated_at
    )
  `);

  const insertSalary = db.prepare(`
    INSERT INTO salaries (
      employee_id, base_salary, currency_code, country, effective_date, created_at
    ) VALUES (
      @employee_id, @base_salary, @currency_code, @country, @effective_date, @created_at
    )
  `);

  faker.seed(42);

  const seed = db.transaction(() => {
    for (let i = 0; i < TARGET_EMPLOYEE_COUNT; i += 1) {
      const country = faker.helpers.arrayElement(COUNTRIES);
      const currencyCode = COUNTRY_CURRENCY[country] ?? 'USD';
      const joiningDate = faker.date.between({
        from: new Date('2018-01-01'),
        to: new Date('2024-06-01'),
      });
      const createdAt = joiningDate.toISOString();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `employee.${i + 1}.${faker.string.alphanumeric(6).toLowerCase()}@acme.test`;

      const result = insertEmployee.run({
        name: `${firstName} ${lastName}`,
        email,
        country,
        department: faker.helpers.arrayElement(DEPARTMENTS),
        currency_code: currencyCode,
        status: faker.number.float({ min: 0, max: 1 }) < 0.92 ? 'active' : 'inactive',
        joining_date: formatDate(joiningDate),
        created_at: createdAt,
        updated_at: createdAt,
      });

      const employeeId = Number(result.lastInsertRowid);
      const initialSalary = randomSalaryForCurrency(currencyCode);
      const now = new Date().toISOString();

      insertSalary.run({
        employee_id: employeeId,
        base_salary: initialSalary,
        currency_code: currencyCode,
        country,
        effective_date: formatDate(joiningDate),
        created_at: now,
      });

      const raiseCount = faker.helpers.weightedArrayElement([
        { value: 0, weight: 75 },
        { value: 1, weight: 20 },
        { value: 2, weight: 5 },
      ]);

      let currentSalary = initialSalary;
      let effectiveDate = joiningDate;

      for (let raise = 0; raise < raiseCount; raise += 1) {
        effectiveDate = addMonths(effectiveDate, faker.number.int({ min: 12, max: 24 }));
        if (effectiveDate > new Date()) {
          break;
        }

        const increasePct = faker.number.float({ min: 0.03, max: 0.12, fractionDigits: 2 });
        currentSalary = Math.round(currentSalary * (1 + increasePct) / 100) * 100;

        insertSalary.run({
          employee_id: employeeId,
          base_salary: currentSalary,
          currency_code: currencyCode,
          country,
          effective_date: formatDate(effectiveDate),
          created_at: now,
        });
      }
    }
  });

  seed();
}

export function runSeed(options: { reset?: boolean } = {}): void {
  runMigrations();

  const db = getDb();
  const employeeCount = (
    db.prepare('SELECT COUNT(*) AS count FROM employees').get() as { count: number }
  ).count;

  if (options.reset) {
    console.log('[seed] resetting seed data');
    clearSeedData();
  } else if (employeeCount >= TARGET_EMPLOYEE_COUNT) {
    seedCurrencies();
    seedAdminUser();
    console.log(`[seed] skipped — ${employeeCount} employees already present`);
    return;
  }

  console.log('[seed] seeding currencies, admin user, and employees');
  seedCurrencies();
  seedAdminUser();
  seedEmployeesAndSalaries();

  const finalCount = (
    db.prepare('SELECT COUNT(*) AS count FROM employees').get() as { count: number }
  ).count;
  const viewCount = (
    db.prepare('SELECT COUNT(*) AS count FROM v_current_salary').get() as { count: number }
  ).count;

  console.log(`[seed] done — ${finalCount} employees, ${viewCount} current salary rows`);
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const reset = process.argv.includes('--reset');
  try {
    runSeed({ reset });
  } finally {
    closeDb();
  }
}
