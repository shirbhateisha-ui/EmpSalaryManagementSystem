import { z } from 'zod';

export const salaryEmployeeIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const addSalarySchema = z.object({
  base_salary: z.number().positive('base_salary must be a positive number'),
  currency_code: z.string().min(1).max(10).toUpperCase(),
  country: z.string().min(1).max(100),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_date must be YYYY-MM-DD'),
});
