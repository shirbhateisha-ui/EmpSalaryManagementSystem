import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { salaryController } from './salary.controller.js';
import { addSalarySchema, salaryEmployeeIdParamSchema } from './salary.validation.js';

export const salaryRoutes = Router();

salaryRoutes.get(
  '/:id/salaries',
  authenticate,
  validate(salaryEmployeeIdParamSchema, 'params'),
  salaryController.list,
);

salaryRoutes.post(
  '/:id/salaries',
  authenticate,
  authorize('ADMIN', 'HR_MANAGER'),
  validate(salaryEmployeeIdParamSchema, 'params'),
  validate(addSalarySchema),
  salaryController.create,
);
