import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils.js';
import { userService } from './user.service.js';

export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = userService.list(req.query as Record<string, unknown>);
    sendSuccess(res, result.users, { meta: result.meta });
  },

  async create(req: Request, res: Response): Promise<void> {
    const user = await userService.create(req.body);
    sendSuccess(res, user, { status: 201 });
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await userService.update(Number(req.params.id), req.body);
    sendSuccess(res, user);
  },
};
