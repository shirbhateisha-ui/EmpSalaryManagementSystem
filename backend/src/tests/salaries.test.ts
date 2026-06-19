import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { closeDb } from '../database/connection.js';
import {
  resetTestDatabase,
  seedTestCurrency,
  seedTestEmployee,
  seedTestSalary,
  seedTestUsers,
} from './helpers/testDb.js';
import { salaryRepository } from '../modules/salaries/salary.repository.js';
import { salaryService } from '../modules/salaries/salary.service.js';

// ── Repository tests ──────────────────────────────────────────────────────────

describe('Salary Repository', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency();
  });

  afterEach(() => {
    closeDb();
  });

  it('creates a salary record and returns it', () => {
    const emp = seedTestEmployee();
    const salary = salaryRepository.create(emp.id, {
      base_salary: 60000,
      currency_code: 'USD',
      country: 'US',
      effective_date: '2024-01-01',
    });

    expect(salary.id).toBeGreaterThan(0);
    expect(salary.employee_id).toBe(emp.id);
    expect(salary.base_salary).toBe(60000);
    expect(salary.currency_code).toBe('USD');
  });

  it('listByEmployee returns records in descending effective_date order', () => {
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 50000, effective_date: '2023-01-01' });
    seedTestSalary(emp.id, { base_salary: 60000, effective_date: '2024-01-01' });
    seedTestSalary(emp.id, { base_salary: 70000, effective_date: '2024-06-01' });

    const history = salaryRepository.listByEmployee(emp.id);
    expect(history).toHaveLength(3);
    expect(history[0].base_salary).toBe(70000);
    expect(history[1].base_salary).toBe(60000);
    expect(history[2].base_salary).toBe(50000);
  });

  it('listByEmployee returns empty array when no salary records exist', () => {
    const emp = seedTestEmployee();
    expect(salaryRepository.listByEmployee(emp.id)).toEqual([]);
  });

  it('latest-effective: v_current_salary reflects the most recent effective_date', () => {
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 50000, effective_date: '2023-01-01' });
    seedTestSalary(emp.id, { base_salary: 80000, effective_date: '2024-06-01' });
    seedTestSalary(emp.id, { base_salary: 65000, effective_date: '2024-01-01' });

    const history = salaryRepository.listByEmployee(emp.id);
    expect(history[0].base_salary).toBe(80000);
    expect(history[0].effective_date).toBe('2024-06-01');
  });

  it('adding a raise appends a new record without mutating prior ones', () => {
    const emp = seedTestEmployee();
    const first = seedTestSalary(emp.id, { base_salary: 50000, effective_date: '2023-01-01' });

    salaryRepository.create(emp.id, {
      base_salary: 70000,
      currency_code: 'USD',
      country: 'US',
      effective_date: '2024-01-01',
    });

    const history = salaryRepository.listByEmployee(emp.id);
    expect(history).toHaveLength(2);

    const original = history.find((s) => s.id === first.id);
    expect(original?.base_salary).toBe(50000);
  });
});

// ── Service tests ─────────────────────────────────────────────────────────────

describe('Salary Service', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency();
  });

  afterEach(() => {
    closeDb();
  });

  it('listByEmployee throws NotFoundError for unknown employee', () => {
    expect(() => salaryService.listByEmployee(9999)).toThrow('Employee not found');
  });

  it('addSalary throws NotFoundError for unknown employee', () => {
    expect(() =>
      salaryService.addSalary(9999, {
        base_salary: 60000,
        currency_code: 'USD',
        country: 'US',
        effective_date: '2024-01-01',
      }),
    ).toThrow('Employee not found');
  });

  it('addSalary creates a new record and returns it', () => {
    const emp = seedTestEmployee();
    const salary = salaryService.addSalary(emp.id, {
      base_salary: 75000,
      currency_code: 'USD',
      country: 'US',
      effective_date: '2024-03-01',
    });

    expect(salary.employee_id).toBe(emp.id);
    expect(salary.base_salary).toBe(75000);
    expect(salary.effective_date).toBe('2024-03-01');
  });

  it('multiple raises accumulate without overwriting', () => {
    const emp = seedTestEmployee();
    salaryService.addSalary(emp.id, { base_salary: 50000, currency_code: 'USD', country: 'US', effective_date: '2023-01-01' });
    salaryService.addSalary(emp.id, { base_salary: 70000, currency_code: 'USD', country: 'US', effective_date: '2024-01-01' });

    const history = salaryService.listByEmployee(emp.id);
    expect(history).toHaveLength(2);
    expect(history[0].base_salary).toBe(70000);
    expect(history[1].base_salary).toBe(50000);
  });
});

// ── API integration tests ─────────────────────────────────────────────────────

describe('Salary API endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency();
    seedTestUsers();
  });

  afterEach(() => {
    closeDb();
  });

  async function loginAs(email: string, password: string): Promise<string> {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.data.accessToken as string;
  }

  it('GET /employees/:id/salaries returns 401 without token', async () => {
    const emp = seedTestEmployee();
    await request(app).get(`/api/v1/employees/${emp.id}/salaries`).expect(401);
  });

  it('GET /employees/:id/salaries returns 404 for unknown employee', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .get('/api/v1/employees/9999/salaries')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /employees/:id/salaries returns empty list when no salaries', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();

    const res = await request(app)
      .get(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('GET /employees/:id/salaries returns history in descending order', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 50000, effective_date: '2023-01-01' });
    seedTestSalary(emp.id, { base_salary: 70000, effective_date: '2024-01-01' });

    const res = await request(app)
      .get(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].base_salary).toBe(70000);
    expect(res.body.data[1].base_salary).toBe(50000);
  });

  it('GET /employees/:id/salaries is accessible by VIEWER role', async () => {
    const token = await loginAs('viewer@test.com', 'Viewer1234');
    const emp = seedTestEmployee();

    await request(app)
      .get(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /employees/:id/salaries returns 403 for VIEWER', async () => {
    const token = await loginAs('viewer@test.com', 'Viewer1234');
    const emp = seedTestEmployee();

    const res = await request(app)
      .post(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ base_salary: 60000, currency_code: 'USD', country: 'US', effective_date: '2024-01-01' })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /employees/:id/salaries creates a salary record (Admin)', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();

    const res = await request(app)
      .post(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ base_salary: 75000, currency_code: 'USD', country: 'US', effective_date: '2024-03-01' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.base_salary).toBe(75000);
    expect(res.body.data.employee_id).toBe(emp.id);
    expect(res.body.data.effective_date).toBe('2024-03-01');
  });

  it('POST /employees/:id/salaries returns 404 for unknown employee', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');

    const res = await request(app)
      .post('/api/v1/employees/9999/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send({ base_salary: 60000, currency_code: 'USD', country: 'US', effective_date: '2024-01-01' })
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /employees/:id/salaries returns 422 on invalid input', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();

    const res = await request(app)
      .post(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ base_salary: -100, effective_date: 'not-a-date' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('adding a salary updates current_salary on GET /employees/:id', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();

    await request(app)
      .post(`/api/v1/employees/${emp.id}/salaries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ base_salary: 90000, currency_code: 'USD', country: 'US', effective_date: '2024-06-01' })
      .expect(201);

    const res = await request(app)
      .get(`/api/v1/employees/${emp.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.current_salary).not.toBeNull();
    expect(res.body.data.current_salary.base_salary).toBe(90000);
  });
});
