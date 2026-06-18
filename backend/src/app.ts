import express, { type Express } from 'express';

/**
 * Builds the Express application.
 * Phase 0: minimal app with a health check. Middleware, routes, error handling,
 * and auth are added in later phases.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
