import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authController } from './auth.controller.js';
import { loginSchema } from './auth.validation.js';

export const authRoutes = Router();

authRoutes.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) => {
  authController.login(req, res).catch(next);
});

authRoutes.post('/refresh', authRateLimiter, (req, res, next) => {
  try {
    authController.refresh(req, res);
  } catch (error) {
    next(error);
  }
});

authRoutes.post('/logout', authenticate, (req, res, next) => {
  try {
    authController.logout(req, res);
  } catch (error) {
    next(error);
  }
});

authRoutes.get('/me', authenticate, (req, res, next) => {
  try {
    authController.me(req, res);
  } catch (error) {
    next(error);
  }
});
