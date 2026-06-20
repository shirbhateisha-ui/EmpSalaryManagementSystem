import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors/AppError.js';
import { comparePassword } from '../../shared/utils/password.utils.js';
import {
  getRefreshTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/utils/jwt.utils.js';
import { generateOpaqueToken, generateTokenId, hashToken } from '../../shared/utils/token.utils.js';
import type { AuthUser } from '../../shared/types/auth.types.js';
import { userRepository } from '../users/user.repository.js';
import { authRepository } from './auth.repository.js';
import type { LoginResult, RefreshResult } from './auth.types.js';

function toAuthUser(user: {
  id: number;
  name: string;
  email: string;
  role: AuthUser['role'];
  status: AuthUser['status'];
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

function issueTokenPair(user: AuthUser): {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
} {
  const jti = generateTokenId();
  const opaqueToken = generateOpaqueToken();
  const tokenHash = hashToken(opaqueToken);
  const expiresAt = getRefreshTokenExpiryDate();

  authRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
  });

  const signedRefreshToken = signRefreshToken({ userId: user.id, jti });
  const refreshToken = `${signedRefreshToken}.${opaqueToken}`;

  return {
    accessToken: signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
    refreshToken,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

function parseRefreshCookie(rawToken: string | undefined): {
  signedPart: string;
  opaquePart: string;
} {
  if (!rawToken) {
    throw new UnauthorizedError('Refresh token missing');
  }

  const lastDot = rawToken.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === rawToken.length - 1) {
    throw new UnauthorizedError('Invalid refresh token format');
  }

  return {
    signedPart: rawToken.slice(0, lastDot),
    opaquePart: rawToken.slice(lastDot + 1),
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is inactive');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const publicUser = toAuthUser(user);
    const tokens = issueTokenPair(publicUser);

    return {
      accessToken: tokens.accessToken,
      user: publicUser,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    };
  },

  refresh(rawRefreshToken: string | undefined): RefreshResult {
    const { signedPart, opaquePart } = parseRefreshCookie(rawRefreshToken);
    const payload = verifyRefreshToken(signedPart);
    const tokenHash = hashToken(opaquePart);
    const stored = authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored || stored.user_id !== payload.sub) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (stored.revoked_at) {
      authRepository.revokeAllUserTokens(stored.user_id);
      throw new UnauthorizedError('Refresh token reuse detected');
    }

    if (new Date(stored.expires_at).getTime() <= Date.now()) {
      authRepository.revokeRefreshToken(tokenHash);
      throw new UnauthorizedError('Refresh token expired');
    }

    const user = userRepository.findById(stored.user_id);
    if (!user || user.status !== 'active') {
      authRepository.revokeAllUserTokens(stored.user_id);
      throw new UnauthorizedError('User account is inactive or not found');
    }

    authRepository.revokeRefreshToken(tokenHash);
    const tokens = issueTokenPair(toAuthUser(user));

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    };
  },

  logout(rawRefreshToken: string | undefined): void {
    if (!rawRefreshToken) {
      return;
    }

    try {
      const { signedPart, opaquePart } = parseRefreshCookie(rawRefreshToken);
      verifyRefreshToken(signedPart);
      authRepository.revokeRefreshToken(hashToken(opaquePart));
    } catch {
      // Ignore invalid logout tokens — cookie will still be cleared.
    }
  },

  getMe(userId: number): AuthUser {
    const user = userRepository.findById(userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account is inactive or not found');
    }
    return toAuthUser(user);
  },

  getRefreshCookieOptions(expiresAt: string) {
    return {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
      expires: new Date(expiresAt),
    };
  },

  getClearRefreshCookieOptions() {
    return {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
    };
  },
};
