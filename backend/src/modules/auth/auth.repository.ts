import { getDb } from '../../database/connection.js';
import type { RefreshTokenRecord } from '../../shared/types/auth.types.js';

export interface CreateRefreshTokenInput {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}

export const authRepository = {
  createRefreshToken(input: CreateRefreshTokenInput): RefreshTokenRecord {
    const db = getDb();
    const result = db
      .prepare(
        `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `,
      )
      .run(input.userId, input.tokenHash, input.expiresAt);

    const row = db
      .prepare('SELECT * FROM refresh_tokens WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as RefreshTokenRecord;

    return row;
  },

  findRefreshTokenByHash(tokenHash: string): RefreshTokenRecord | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash) as
      | RefreshTokenRecord
      | undefined;
  },

  revokeRefreshToken(tokenHash: string): void {
    const db = getDb();
    db.prepare(
      `
      UPDATE refresh_tokens
      SET revoked_at = datetime('now')
      WHERE token_hash = ? AND revoked_at IS NULL
    `,
    ).run(tokenHash);
  },

  revokeAllUserTokens(userId: number): void {
    const db = getDb();
    db.prepare(
      `
      UPDATE refresh_tokens
      SET revoked_at = datetime('now')
      WHERE user_id = ? AND revoked_at IS NULL
    `,
    ).run(userId);
  },
};
