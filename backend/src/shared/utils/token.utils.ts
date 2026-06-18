import crypto from 'node:crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
