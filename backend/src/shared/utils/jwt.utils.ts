import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { AccessTokenPayload, RefreshTokenPayload, UserRole } from '../types/auth.types.js';
import { UnauthorizedError } from '../errors/AppError.js';

export function signAccessToken(payload: {
  userId: number;
  email: string;
  role: UserRole;
}): string {
  const tokenPayload: AccessTokenPayload = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'access',
  };

  return jwt.sign(tokenPayload, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl as SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: { userId: number; jti: string }): string {
  const tokenPayload: RefreshTokenPayload = {
    sub: payload.userId,
    jti: payload.jti,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.accessTokenSecret) as JwtPayload & AccessTokenPayload;
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid access token');
    }
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.refreshTokenSecret) as JwtPayload & RefreshTokenPayload;
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export function getRefreshTokenExpiryDate(): Date {
  const ttlMs = parseDurationToMs(env.refreshTokenTtl);
  return new Date(Date.now() + ttlMs);
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
