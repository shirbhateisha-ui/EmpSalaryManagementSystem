import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'VIEWER']),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    role: z.enum(['ADMIN', 'HR_MANAGER', 'VIEWER']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
