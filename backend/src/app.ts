import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { notFoundHandler } from './middleware/notFoundHandler.middleware.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { apiRouter } from './routes/index.js';
import { sendSuccess } from './shared/utils/response.utils.js';

/**
 * Builds the Express application with auth, RBAC, and shared infrastructure.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.get('/health', (_req, res) => {
    sendSuccess(res, { status: 'ok' });
  });

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
