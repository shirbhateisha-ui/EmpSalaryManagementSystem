import { z } from 'zod';

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  country: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sort: z
    .enum(['name', 'department', 'country', 'joining_date', 'base_salary_usd', 'created_at'])
    .optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email address'),
  country: z.string().trim().min(1, 'Country is required'),
  department: z.string().trim().min(1, 'Department is required'),
  currency_code: z.string().trim().min(1, 'Currency code is required'),
  joining_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'joining_date must be YYYY-MM-DD'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateEmployeeSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    country: z.string().trim().min(1).optional(),
    department: z.string().trim().min(1).optional(),
    currency_code: z.string().trim().min(1).optional(),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const employeeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
