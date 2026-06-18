import { getDb } from '../../database/connection.js';
import type { AuthUser, UserRecord, UserRole, UserStatus } from '../../shared/types/auth.types.js';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserInput {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  passwordHash?: string;
}

function mapUser(row: UserRecord): UserRecord {
  return row;
}

function toPublicUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export const userRepository = {
  findById(id: number): UserRecord | undefined {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRecord | undefined;
    return row ? mapUser(row) : undefined;
  },

  findByEmail(email: string): UserRecord | undefined {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRecord | undefined;
    return row ? mapUser(row) : undefined;
  },

  list(offset: number, limit: number): { users: AuthUser[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number })
      .count;

    const rows = db
      .prepare(`
        SELECT id, name, email, role, status, created_at, updated_at
        FROM users
        ORDER BY id ASC
        LIMIT ? OFFSET ?
      `)
      .all(limit, offset) as Omit<UserRecord, 'password_hash'>[];

    return {
      users: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
      })),
      total,
    };
  },

  create(input: CreateUserInput): AuthUser {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(`
        INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.name,
        input.email.toLowerCase(),
        input.passwordHash,
        input.role,
        input.status ?? 'active',
        now,
        now,
      );

    const created = this.findById(Number(result.lastInsertRowid));
    if (!created) {
      throw new Error('Failed to create user');
    }
    return toPublicUser(created);
  },

  update(id: number, input: UpdateUserInput): AuthUser | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        status = COALESCE(?, status),
        password_hash = COALESCE(?, password_hash),
        updated_at = ?
      WHERE id = ?
    `).run(
      input.name ?? null,
      input.role ?? null,
      input.status ?? null,
      input.passwordHash ?? null,
      now,
      id,
    );

    const updated = this.findById(id);
    return updated ? toPublicUser(updated) : undefined;
  },
};
