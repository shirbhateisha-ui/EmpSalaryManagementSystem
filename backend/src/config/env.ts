import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DB_PATH: z.string().default('./data/app.db'),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(16)
    .default(
      '9c15ff4435926f850383af8cf2cd1ecfc83ea7c801b4754ec1243d5ee1c52808029f39df53653ac86043981ed1407327e4a24c0944802da12800914453f34b1c',
    ),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16)
    .default(
      'af9d974d6ba8093b37f6105d29d485a5ed44b06f3a8cb0d25207ef7d7daafc67f8166957f02c4ec1c24eb4bf4aff3e7c0a49b2058e2cd42e857d283d43099b85',
    ),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  ADMIN_EMAIL: z.string().email().default('admin@acme.com'),
  ADMIN_PASSWORD: z.string().min(1).default('i'),
  ADMIN_NAME: z.string().min(1).default('System Admin'),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}

const parsed = parseEnv();

function resolveDbPath(dbPath: string): string {
  if (dbPath === ':memory:' || dbPath.startsWith('file:')) {
    return dbPath;
  }
  return path.resolve(backendRoot, dbPath);
}

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  corsOrigin: parsed.CORS_ORIGIN,
  dbPath: resolveDbPath(parsed.DB_PATH),
  accessTokenSecret: parsed.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: parsed.REFRESH_TOKEN_SECRET,
  accessTokenTtl: parsed.ACCESS_TOKEN_TTL,
  refreshTokenTtl: parsed.REFRESH_TOKEN_TTL,
  adminEmail: parsed.ADMIN_EMAIL,
  adminPassword: parsed.ADMIN_PASSWORD,
  adminName: parsed.ADMIN_NAME,
  isProduction: parsed.NODE_ENV === 'production',
} as const;
