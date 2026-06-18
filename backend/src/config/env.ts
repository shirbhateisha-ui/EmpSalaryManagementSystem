import 'dotenv/config';

/**
 * Minimal environment access for Phase 0.
 * Replaced by Zod-validated config in a later phase.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
} as const;
