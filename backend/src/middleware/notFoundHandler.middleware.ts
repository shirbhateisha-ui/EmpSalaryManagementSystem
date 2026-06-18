import type { Request, Response } from 'express';
import { sendError } from '../shared/utils/response.utils.js';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(
    res,
    {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    404,
  );
}
