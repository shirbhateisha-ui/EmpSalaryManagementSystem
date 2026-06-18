export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'VIEWER';
export type UserStatus = 'active' | 'inactive';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface UserRecord extends AuthUser {
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRecord {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: UserRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string;
  type: 'refresh';
}
