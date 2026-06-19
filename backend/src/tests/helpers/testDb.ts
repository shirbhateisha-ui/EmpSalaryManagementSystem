import { closeDb, getDb } from '../../database/connection.js';
import { runMigrations } from '../../database/migrate.js';
import { hashPasswordSync } from '../../shared/utils/password.utils.js';

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

export function extractRefreshCookie(cookies: string | string[] | undefined): string {
  const header = Array.isArray(cookies) ? cookies.join('; ') : (cookies ?? '');
  const match = /refresh_token=([^;]+)/.exec(header);
  if (!match) {
    throw new Error('Refresh token cookie not found');
  }
  return decodeURIComponent(match[1]);
}
