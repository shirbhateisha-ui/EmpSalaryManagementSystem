import bcrypt from 'bcrypt';
import { ValidationError } from '../errors/AppError.js';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function assertPasswordStrength(password: string): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError('Password must be at least 8 characters long', {
      field: 'password',
    });
  }

  if (!PASSWORD_PATTERN.test(password)) {
    throw new ValidationError('Password must contain at least one letter and one number', {
      field: 'password',
    });
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordStrength(password);
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** Used by seed script where strength rules are not enforced. */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}
