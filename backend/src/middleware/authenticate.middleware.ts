import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt.utils.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';
import { userRepository } from '../modules/users/user.repository.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = verifyAccessToken(token);
    const user = userRepository.findById(payload.sub);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account is inactive or not found');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
}
