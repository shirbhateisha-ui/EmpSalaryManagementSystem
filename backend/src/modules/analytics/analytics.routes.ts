import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { analyticsController } from './analytics.controller.js';
import { topEarnersQuerySchema } from './analytics.validation.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);

analyticsRoutes.get('/summary', analyticsController.summary);
analyticsRoutes.get('/by-country', analyticsController.byCountry);
analyticsRoutes.get('/by-department', analyticsController.byDepartment);
analyticsRoutes.get('/distribution', analyticsController.distribution);
analyticsRoutes.get(
  '/top-earners',
  validate(topEarnersQuerySchema, 'query'),
  analyticsController.topEarners,
);
