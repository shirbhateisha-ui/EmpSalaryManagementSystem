import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Minimal environment access for Phase 0–1.
 * Replaced by Zod-validated config in a later phase.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  dbPath: path.resolve(backendRoot, process.env.DB_PATH ?? './data/app.db'),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@acme.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'i',
  adminName: process.env.ADMIN_NAME ?? 'System Admin',
} as const;
