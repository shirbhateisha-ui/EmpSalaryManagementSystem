import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../shared/errors/AppError.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(
        new ValidationError('Validation failed', result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))),
      );
      return;
    }

    req[part] = result.data;
    next();
  };
}
