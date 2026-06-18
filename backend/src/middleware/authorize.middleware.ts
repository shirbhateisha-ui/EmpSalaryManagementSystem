import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../shared/types/auth.types.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/AppError.js';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
