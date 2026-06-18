import type { AuthUser } from '../shared/types/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
