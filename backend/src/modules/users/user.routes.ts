import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.middleware.js';
import { authorize } from '../../middleware/authorize.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { userController } from './user.controller.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './user.validation.js';

export const userRoutes = Router();

userRoutes.use(authenticate, authorize('ADMIN'));

userRoutes.get('/', validate(listUsersQuerySchema, 'query'), (req, res, next) => {
  userController.list(req, res).catch(next);
});

userRoutes.post('/', validate(createUserSchema), (req, res, next) => {
  userController.create(req, res).catch(next);
});

userRoutes.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  (req, res, next) => {
    userController.update(req, res).catch(next);
  },
);
