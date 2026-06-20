import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { closeDb } from '../database/connection.js';
import {
  resetTestDatabase,
  seedTestCurrency,
  seedTestEmployee,
  seedTestUsers,
} from './helpers/testDb.js';
import { employeeRepository } from '../modules/employees/employee.repository.js';
import { employeeService } from '../modules/employees/employee.service.js';

// ── Repository tests ──────────────────────────────────────────────────────────

describe('Employee Repository', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency();
  });

  afterEach(() => {
    closeDb();
  });

  it('creates an employee and retrieves it by id', () => {
    const emp = employeeRepository.create({
      name: 'Alice',
      email: 'alice@acme.com',
      country: 'US',
      department: 'Engineering',
      currency_code: 'USD',
      joining_date: '2024-01-15',
    });

    expect(emp.id).toBeGreaterThan(0);
    expect(emp.email).toBe('alice@acme.com');
    expect(emp.current_salary).toBeNull();

    const found = employeeRepository.findById(emp.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Alice');
  });

  it('findById returns undefined for an unknown id', () => {
    expect(employeeRepository.findById(9999)).toBeUndefined();
  });

  it('findByEmail is case-insensitive', () => {
    seedTestEmployee({ email: 'Bob@Acme.com' });
    expect(employeeRepository.findByEmail('bob@acme.com')).toBeDefined();
    expect(employeeRepository.findByEmail('BOB@ACME.COM')).toBeDefined();
  });

  it('updates an employee', () => {
    const emp = seedTestEmployee();
    const updated = employeeRepository.update(emp.id, {
      department: 'Finance',
      status: 'inactive',
    });

    expect(updated).toBeDefined();
    expect(updated!.department).toBe('Finance');
    expect(updated!.status).toBe('inactive');
  });

  it('update returns undefined for an unknown id', () => {
    expect(employeeRepository.update(9999, { department: 'X' })).toBeUndefined();
  });

  it('lists employees with default pagination', () => {
    seedTestEmployee({ email: 'a@test.com', name: 'Alice' });
    seedTestEmployee({ email: 'b@test.com', name: 'Bob' });

    const result = employeeRepository.list({ page: 1, limit: 10, offset: 0 });
    expect(result.total).toBe(2);
    expect(result.employees).toHaveLength(2);
  });

  it('paginates correctly', () => {
    for (let i = 1; i <= 5; i++) {
      seedTestEmployee({ email: `emp${i}@test.com`, name: `Employee ${i}` });
    }

    const page1 = employeeRepository.list({ page: 1, limit: 2, offset: 0 });
    expect(page1.total).toBe(5);
    expect(page1.employees).toHaveLength(2);

    const page3 = employeeRepository.list({ page: 3, limit: 2, offset: 4 });
    expect(page3.employees).toHaveLength(1);
  });

  it('filters by department', () => {
    seedTestEmployee({ email: 'eng@test.com', department: 'Engineering' });
    seedTestEmployee({ email: 'hr@test.com', department: 'HR' });

    const result = employeeRepository.list({
      page: 1,
      limit: 10,
      offset: 0,
      department: 'Engineering',
    });
    expect(result.total).toBe(1);
    expect(result.employees[0].department).toBe('Engineering');
  });

  it('filters by status', () => {
    seedTestEmployee({ email: 'active@test.com', status: 'active' });
    seedTestEmployee({ email: 'inactive@test.com', status: 'inactive' });

    const active = employeeRepository.list({ page: 1, limit: 10, offset: 0, status: 'active' });
    expect(active.total).toBe(1);

    const inactive = employeeRepository.list({ page: 1, limit: 10, offset: 0, status: 'inactive' });
    expect(inactive.total).toBe(1);
  });

  it('searches across name, email, department, country', () => {
    seedTestEmployee({ name: 'Zara Smith', email: 'zara@test.com', department: 'Engineering' });
    seedTestEmployee({ name: 'John Doe', email: 'john@test.com', department: 'HR' });

    const result = employeeRepository.list({ page: 1, limit: 10, offset: 0, search: 'zara' });
    expect(result.total).toBe(1);
    expect(result.employees[0].name).toBe('Zara Smith');
  });

  it('sorts by name ascending', () => {
    seedTestEmployee({ email: 'charlie@test.com', name: 'Charlie' });
    seedTestEmployee({ email: 'alice@test.com', name: 'Alice' });
    seedTestEmployee({ email: 'bob@test.com', name: 'Bob' });

    const result = employeeRepository.list({
      page: 1,
      limit: 10,
      offset: 0,
      sort: 'name',
      order: 'asc',
    });
    expect(result.employees.map((e) => e.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });
});

// ── Service tests ─────────────────────────────────────────────────────────────

describe('Employee Service', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency();
  });

  afterEach(() => {
    closeDb();
  });

  it('get throws NotFoundError for unknown id', () => {
    expect(() => employeeService.get(9999)).toThrow('Employee not found');
  });

  it('create returns the new employee', () => {
    const emp = employeeService.create({
      name: 'Priya',
      email: 'priya@acme.com',
      country: 'IN',
      department: 'Product',
      currency_code: 'USD',
      joining_date: '2024-06-01',
    });
    expect(emp.id).toBeGreaterThan(0);
    expect(emp.email).toBe('priya@acme.com');
  });

  it('create throws ConflictError on duplicate email', () => {
    seedTestEmployee({ email: 'dup@acme.com' });
    expect(() =>
      employeeService.create({
        name: 'Dup',
        email: 'dup@acme.com',
        country: 'US',
        department: 'Eng',
        currency_code: 'USD',
        joining_date: '2024-01-01',
      }),
    ).toThrow('Email is already registered to another employee');
  });

  it('update succeeds and returns updated employee', () => {
    const emp = seedTestEmployee({ email: 'upd@acme.com' });
    const updated = employeeService.update(emp.id, { department: 'Legal' });
    expect(updated.department).toBe('Legal');
  });

  it('update throws NotFoundError for unknown id', () => {
    expect(() => employeeService.update(9999, { department: 'X' })).toThrow('Employee not found');
  });

  it('update throws ConflictError when email already taken by another employee', () => {
    seedTestEmployee({ email: 'taken@acme.com' });
    const emp = seedTestEmployee({ email: 'other@acme.com' });
    expect(() => employeeService.update(emp.id, { email: 'taken@acme.com' })).toThrow(
      'Email is already registered to another employee',
    );
  });
});

// ── API integration tests ─────────────────────────────────────────────────────

describe('Employee API endpoints', () => {
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
    const res = await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200);
    return res.body.data.accessToken as string;
  }

  it('GET /employees returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/employees').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /employees returns empty list when no employees exist', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('POST /employees returns 403 for VIEWER role', async () => {
    const token = await loginAs('viewer@test.com', 'Viewer1234');
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test',
        email: 'test@acme.com',
        country: 'US',
        department: 'Eng',
        currency_code: 'USD',
        joining_date: '2024-01-01',
      })
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('POST /employees creates an employee (Admin)', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane Doe',
        email: 'jane@acme.com',
        country: 'US',
        department: 'Engineering',
        currency_code: 'USD',
        joining_date: '2024-03-01',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('jane@acme.com');
    expect(res.body.data.current_salary).toBeNull();
  });

  it('POST /employees returns 409 on duplicate email', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    seedTestEmployee({ email: 'jane@acme.com' });

    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jane 2',
        email: 'jane@acme.com',
        country: 'US',
        department: 'HR',
        currency_code: 'USD',
        joining_date: '2024-01-01',
      })
      .expect(409);

    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('POST /employees returns 422 on missing required fields', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Email' })
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /employees/:id returns the employee', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee({ name: 'Alice', email: 'alice@acme.com' });

    const res = await request(app)
      .get(`/api/v1/employees/${emp.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.name).toBe('Alice');
    expect(res.body.data.current_salary).toBeNull();
  });

  it('GET /employees/:id returns 404 for unknown id', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .get('/api/v1/employees/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /employees/:id updates the employee', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee({ email: 'upd@acme.com', department: 'Sales' });

    const res = await request(app)
      .patch(`/api/v1/employees/${emp.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ department: 'Marketing', status: 'inactive' })
      .expect(200);

    expect(res.body.data.department).toBe('Marketing');
    expect(res.body.data.status).toBe('inactive');
  });

  it('GET /employees supports search param', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    seedTestEmployee({ name: 'Zara Smith', email: 'zara@acme.com', department: 'Design' });
    seedTestEmployee({ name: 'John Doe', email: 'john@acme.com', department: 'Sales' });

    const res = await request(app)
      .get('/api/v1/employees?search=zara')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Zara Smith');
  });

  it('GET /employees supports department filter', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    seedTestEmployee({ email: 'eng@acme.com', department: 'Engineering' });
    seedTestEmployee({ email: 'hr@acme.com', department: 'HR' });

    const res = await request(app)
      .get('/api/v1/employees?department=Engineering')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].department).toBe('Engineering');
  });
});
