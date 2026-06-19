import { z } from 'zod';

export const topEarnersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
});
