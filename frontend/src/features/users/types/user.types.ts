import type { Role, UserStatus } from '@/features/auth/types/auth.types';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  name?: string;
  role?: Role;
  status?: UserStatus;
}
