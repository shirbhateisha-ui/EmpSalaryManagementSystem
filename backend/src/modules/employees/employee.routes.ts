import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { employeeController } from './employee.controller.js';
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from './employee.validation.js';

export const employeeRoutes = Router();

employeeRoutes.get(
  '/',
  authenticate,
  validate(listEmployeesQuerySchema, 'query'),
  employeeController.list,
);

employeeRoutes.get(
  '/:id',
  authenticate,
  validate(employeeIdParamSchema, 'params'),
  employeeController.get,
);

employeeRoutes.post(
  '/',
  authenticate,
  authorize('ADMIN', 'HR_MANAGER'),
  validate(createEmployeeSchema),
  employeeController.create,
);

employeeRoutes.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'HR_MANAGER'),
  validate(employeeIdParamSchema, 'params'),
  validate(updateEmployeeSchema),
  employeeController.update,
);
