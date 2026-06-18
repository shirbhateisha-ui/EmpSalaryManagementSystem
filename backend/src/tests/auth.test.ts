import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { comparePassword } from '../shared/utils/password.utils.js';
import { verifyAccessToken } from '../shared/utils/jwt.utils.js';
import { closeDb } from '../database/connection.js';
import { extractRefreshCookie, resetTestDatabase, seedTestUsers } from './helpers/testDb.js';

describe('Auth + RBAC', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
    seedTestUsers();
  });

  afterEach(() => {
    closeDb();
  });

  it('logs in successfully and returns an access token with refresh cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTypeOf('string');
    expect(response.body.data.user.email).toBe('admin@test.com');

    const cookie = response.headers['set-cookie'];
    expect(cookie?.[0]).toContain('refresh_token=');
    expect(cookie?.[0]).toContain('HttpOnly');
  });

  it('rejects invalid login credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong-password' })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('compares passwords correctly', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234' })
      .expect(200);

    const payload = verifyAccessToken(login.body.data.accessToken);
    expect(payload.email).toBe('admin@test.com');
    expect(payload.role).toBe('ADMIN');
    expect(await comparePassword('Admin1234', '$2b$12$invalid')).toBe(false);
  });

  it('rejects protected routes without a token', async () => {
    const response = await request(app).get('/api/v1/auth/me').expect(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects protected routes with an invalid token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rotates refresh tokens and rejects reuse', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234' })
      .expect(200);

    const originalCookie = extractRefreshCookie(login.headers['set-cookie']);

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${originalCookie}`)
      .expect(200);

    expect(refresh.body.data.accessToken).toBeTypeOf('string');
    const rotatedCookie = extractRefreshCookie(refresh.headers['set-cookie']);
    expect(rotatedCookie).not.toBe(originalCookie);

    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${originalCookie}`)
      .expect(401);

    expect(reuse.body.error.message).toContain('reuse');

    const afterReuse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${rotatedCookie}`)
      .expect(401);

    expect(afterReuse.body.error.code).toBe('UNAUTHORIZED');
  });

  it('blocks non-admin users from user management', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@test.com', password: 'Viewer1234' })
      .expect(200);

    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('allows admin user management', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234' })
      .expect(200);

    const token = login.body.data.accessToken;

    const list = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.success).toBe(true);
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);
    expect(list.body.meta).toBeDefined();

    const create = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'HR Manager',
        email: 'hr@test.com',
        password: 'HrManager1',
        role: 'HR_MANAGER',
      })
      .expect(201);

    expect(create.body.data.email).toBe('hr@test.com');

    const patch = await request(app)
      .patch(`/api/v1/users/${create.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' })
      .expect(200);

    expect(patch.body.data.status).toBe('inactive');
  });

  it('logs out and clears refresh cookie', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin1234' })
      .expect(200);

    const cookie = extractRefreshCookie(login.headers['set-cookie']);

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .set('Cookie', `refresh_token=${cookie}`)
      .expect(200);

    await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh_token=${cookie}`)
      .expect(401);
  });
});
