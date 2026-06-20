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
import { analyticsRepository } from '../modules/analytics/analytics.repository.js';
import { analyticsService } from '../modules/analytics/analytics.service.js';

// ── Repository tests ──────────────────────────────────────────────────────────

describe('Analytics Repository', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency('USD', 1.0);
  });

  afterEach(() => {
    closeDb();
  });

  it('summary returns zeros when no active employees have salaries', () => {
    const result = analyticsRepository.summary();
    expect(result.headcount).toBe(0);
    expect(result.total_annual_usd).toBe(0);
    expect(result.avg_annual_usd).toBe(0);
  });

  it('summary counts only active employees', () => {
    const active = seedTestEmployee({ email: 'a@test.com', status: 'active' });
    seedTestSalary(active.id, { base_salary: 60000, effective_date: '2024-01-01' });
    const inactive = seedTestEmployee({ email: 'b@test.com', status: 'inactive' });
    seedTestSalary(inactive.id, { base_salary: 80000, effective_date: '2024-01-01' });

    const result = analyticsRepository.summary();
    expect(result.headcount).toBe(1);
    expect(result.total_annual_usd).toBe(60000);
  });

  it('summary aggregates correct total, avg, min, max', () => {
    const e1 = seedTestEmployee({ email: 'e1@test.com' });
    const e2 = seedTestEmployee({ email: 'e2@test.com' });
    const e3 = seedTestEmployee({ email: 'e3@test.com' });
    seedTestSalary(e1.id, { base_salary: 40000, effective_date: '2024-01-01' });
    seedTestSalary(e2.id, { base_salary: 80000, effective_date: '2024-01-01' });
    seedTestSalary(e3.id, { base_salary: 120000, effective_date: '2024-01-01' });

    const r = analyticsRepository.summary();
    expect(r.headcount).toBe(3);
    expect(r.total_annual_usd).toBe(240000);
    expect(r.avg_annual_usd).toBeCloseTo(80000, 2);
    expect(r.min_annual_usd).toBe(40000);
    expect(r.max_annual_usd).toBe(120000);
  });

  it('summary normalises cross-currency totals to USD', () => {
    seedTestCurrency('EUR', 1.1);
    const usdEmp = seedTestEmployee({ email: 'usd@test.com', currency_code: 'USD' });
    const eurEmp = seedTestEmployee({ email: 'eur@test.com', currency_code: 'EUR' });
    seedTestSalary(usdEmp.id, {
      base_salary: 50000,
      currency_code: 'USD',
      effective_date: '2024-01-01',
    });
    seedTestSalary(eurEmp.id, {
      base_salary: 50000,
      currency_code: 'EUR',
      effective_date: '2024-01-01',
    });

    const r = analyticsRepository.summary();
    expect(r.total_annual_usd).toBeCloseTo(50000 + 50000 * 1.1, 2);
  });

  it('byCountry groups and orders by total_annual_usd desc', () => {
    const us = seedTestEmployee({ email: 'us@test.com', country: 'US' });
    const uk = seedTestEmployee({ email: 'uk@test.com', country: 'UK' });
    seedTestSalary(us.id, { base_salary: 100000, effective_date: '2024-01-01' });
    seedTestSalary(uk.id, { base_salary: 60000, effective_date: '2024-01-01' });

    const rows = analyticsRepository.byCountry();
    expect(rows[0].country).toBe('US');
    expect(rows[0].headcount).toBe(1);
    expect(rows[0].total_annual_usd).toBe(100000);
    expect(rows[1].country).toBe('UK');
  });

  it('byDepartment groups and orders by total_annual_usd desc', () => {
    const eng = seedTestEmployee({ email: 'eng@test.com', department: 'Engineering' });
    const hr = seedTestEmployee({ email: 'hr@test.com', department: 'HR' });
    seedTestSalary(eng.id, { base_salary: 90000, effective_date: '2024-01-01' });
    seedTestSalary(hr.id, { base_salary: 50000, effective_date: '2024-01-01' });

    const rows = analyticsRepository.byDepartment();
    expect(rows[0].department).toBe('Engineering');
    expect(rows[0].total_annual_usd).toBe(90000);
    expect(rows[1].department).toBe('HR');
  });

  it('topEarners respects the limit and orders by salary desc', () => {
    for (let i = 1; i <= 5; i++) {
      const emp = seedTestEmployee({ email: `e${i}@test.com` });
      seedTestSalary(emp.id, { base_salary: i * 10000, effective_date: '2024-01-01' });
    }

    const top3 = analyticsRepository.topEarners(3);
    expect(top3).toHaveLength(3);
    expect(top3[0].annual_usd).toBe(50000);
    expect(top3[1].annual_usd).toBe(40000);
    expect(top3[2].annual_usd).toBe(30000);
  });

  it('distributionCounts buckets salaries into correct bands', () => {
    const salaries = [20000, 45000, 75000, 105000, 135000, 200000];
    for (let i = 0; i < salaries.length; i++) {
      const emp = seedTestEmployee({ email: `d${i}@test.com` });
      seedTestSalary(emp.id, { base_salary: salaries[i], effective_date: '2024-01-01' });
    }

    const counts = analyticsRepository.distributionCounts();
    const map = new Map(counts.map((r) => [r.band_index, r.headcount]));
    expect(map.get(0)).toBe(1); // Under $30k
    expect(map.get(1)).toBe(1); // $30k-$60k
    expect(map.get(2)).toBe(1); // $60k-$90k
    expect(map.get(3)).toBe(1); // $90k-$120k
    expect(map.get(4)).toBe(1); // $120k-$150k
    expect(map.get(5)).toBe(1); // Over $150k
  });
});

// ── Service tests ─────────────────────────────────────────────────────────────

describe('Analytics Service', () => {
  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency('USD', 1.0);
  });

  afterEach(() => {
    closeDb();
  });

  it('summary total_monthly_usd = total_annual_usd / 12', () => {
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 120000, effective_date: '2024-01-01' });

    const result = analyticsService.summary();
    expect(result.total_annual_usd).toBe(120000);
    expect(result.total_monthly_usd).toBeCloseTo(10000, 2);
  });

  it('distribution always returns all 6 bands including zero-count ones', () => {
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 50000, effective_date: '2024-01-01' });

    const bands = analyticsService.distribution();
    expect(bands).toHaveLength(6);
    expect(bands[0].band).toBe('Under $30k');
    expect(bands[5].band).toBe('Over $150k');

    const populated = bands.find((b) => b.band === '$30k–$60k');
    expect(populated?.headcount).toBe(1);

    const empty = bands.filter((b) => b.band !== '$30k–$60k');
    empty.forEach((b) => expect(b.headcount).toBe(0));
  });

  it('distribution band boundaries are inclusive-lower exclusive-upper', () => {
    const emp1 = seedTestEmployee({ email: 'boundary1@test.com' });
    const emp2 = seedTestEmployee({ email: 'boundary2@test.com' });
    seedTestSalary(emp1.id, { base_salary: 30000, effective_date: '2024-01-01' }); // exactly 30k → $30k–$60k
    seedTestSalary(emp2.id, { base_salary: 29999, effective_date: '2024-01-01' }); // just below → Under $30k

    const bands = analyticsService.distribution();
    expect(bands.find((b) => b.band === 'Under $30k')?.headcount).toBe(1);
    expect(bands.find((b) => b.band === '$30k–$60k')?.headcount).toBe(1);
  });

  it('topEarners monthly_usd = annual_usd / 12', () => {
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 120000, effective_date: '2024-01-01' });

    const earners = analyticsService.topEarners(1);
    expect(earners[0].annual_usd).toBe(120000);
    expect(earners[0].monthly_usd).toBeCloseTo(10000, 2);
  });
});

// ── API integration tests ─────────────────────────────────────────────────────

describe('Analytics API endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
    seedTestCurrency('USD', 1.0);
    seedTestUsers();
  });

  afterEach(() => {
    closeDb();
  });

  async function loginAs(email: string, password: string): Promise<string> {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200);
    return res.body.data.accessToken as string;
  }

  it('all analytics endpoints return 401 without token', async () => {
    const endpoints = [
      '/api/v1/analytics/summary',
      '/api/v1/analytics/by-country',
      '/api/v1/analytics/by-department',
      '/api/v1/analytics/distribution',
      '/api/v1/analytics/top-earners',
    ];
    for (const url of endpoints) {
      const res = await request(app).get(url);
      expect(res.status, `expected 401 for ${url}`).toBe(401);
    }
  });

  it('GET /analytics/summary returns correct structure', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const emp = seedTestEmployee();
    seedTestSalary(emp.id, { base_salary: 120000, effective_date: '2024-01-01' });

    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const d = res.body.data;
    expect(d.headcount).toBe(1);
    expect(d.total_annual_usd).toBe(120000);
    expect(d.total_monthly_usd).toBeCloseTo(10000, 2);
    expect(d.avg_annual_usd).toBe(120000);
    expect(d.min_annual_usd).toBe(120000);
    expect(d.max_annual_usd).toBe(120000);
  });

  it('GET /analytics/by-country returns array ordered by total desc', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const us = seedTestEmployee({ email: 'us@test.com', country: 'US' });
    const uk = seedTestEmployee({ email: 'uk@test.com', country: 'UK' });
    seedTestSalary(us.id, { base_salary: 100000, effective_date: '2024-01-01' });
    seedTestSalary(uk.id, { base_salary: 50000, effective_date: '2024-01-01' });

    const res = await request(app)
      .get('/api/v1/analytics/by-country')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data[0].country).toBe('US');
    expect(res.body.data[1].country).toBe('UK');
  });

  it('GET /analytics/by-department returns array ordered by total desc', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const eng = seedTestEmployee({ email: 'eng@test.com', department: 'Engineering' });
    const hr = seedTestEmployee({ email: 'hr@test.com', department: 'HR' });
    seedTestSalary(eng.id, { base_salary: 90000, effective_date: '2024-01-01' });
    seedTestSalary(hr.id, { base_salary: 40000, effective_date: '2024-01-01' });

    const res = await request(app)
      .get('/api/v1/analytics/by-department')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data[0].department).toBe('Engineering');
  });

  it('GET /analytics/distribution returns all 6 bands', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');

    const res = await request(app)
      .get('/api/v1/analytics/distribution')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(6);
    expect(res.body.data[0].band).toBe('Under $30k');
    expect(res.body.data[5].band).toBe('Over $150k');
  });

  it('GET /analytics/top-earners defaults to top 10', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    for (let i = 1; i <= 15; i++) {
      const emp = seedTestEmployee({ email: `top${i}@test.com` });
      seedTestSalary(emp.id, { base_salary: i * 5000, effective_date: '2024-01-01' });
    }

    const res = await request(app)
      .get('/api/v1/analytics/top-earners')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(10);
    expect(res.body.data[0].annual_usd).toBe(75000);
  });

  it('GET /analytics/top-earners respects custom limit', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    for (let i = 1; i <= 5; i++) {
      const emp = seedTestEmployee({ email: `lim${i}@test.com` });
      seedTestSalary(emp.id, { base_salary: i * 10000, effective_date: '2024-01-01' });
    }

    const res = await request(app)
      .get('/api/v1/analytics/top-earners?limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(3);
  });

  it('GET /analytics/top-earners returns 422 for invalid limit', async () => {
    const token = await loginAs('admin@test.com', 'Admin1234');
    const res = await request(app)
      .get('/api/v1/analytics/top-earners?limit=200')
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('VIEWER role can access all analytics endpoints', async () => {
    const token = await loginAs('viewer@test.com', 'Viewer1234');

    await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app)
      .get('/api/v1/analytics/by-country')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app)
      .get('/api/v1/analytics/by-department')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app)
      .get('/api/v1/analytics/distribution')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app)
      .get('/api/v1/analytics/top-earners')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
