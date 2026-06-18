export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface LoginResult {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}
