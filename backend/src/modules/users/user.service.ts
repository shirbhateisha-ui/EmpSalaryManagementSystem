import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { hashPassword } from '../../shared/utils/password.utils.js';
import type { AuthUser, UserRole, UserStatus } from '../../shared/types/auth.types.js';
import { buildPaginationMeta, parsePaginationQuery } from '../../shared/utils/pagination.utils.js';
import type { PaginationMeta } from '../../shared/utils/response.utils.js';
import { userRepository } from './user.repository.js';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export const userService = {
  list(query: Record<string, unknown>): { users: AuthUser[]; meta: PaginationMeta } {
    const { page, limit, offset } = parsePaginationQuery(query);
    const { users, total } = userRepository.list(offset, limit);
    return {
      users,
      meta: buildPaginationMeta({ page, limit, total }),
    };
  },

  async create(input: CreateUserDto): Promise<AuthUser> {
    const existing = userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await hashPassword(input.password);
    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
  },

  async update(id: number, input: UpdateUserDto): Promise<AuthUser> {
    const existing = userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = input.password ? await hashPassword(input.password) : undefined;
    const updated = userRepository.update(id, {
      name: input.name,
      role: input.role,
      status: input.status,
      passwordHash,
    });

    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return updated;
  },
};
