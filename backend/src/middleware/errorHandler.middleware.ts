import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/AppError.js';
import { sendError } from '../shared/utils/response.utils.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode,
    );
    return;
  }

  console.error('[error]', err);
  sendError(
    res,
    {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
    500,
  );
}
