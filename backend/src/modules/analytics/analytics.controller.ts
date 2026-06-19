import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils.js';
import { analyticsService } from './analytics.service.js';

export const analyticsController = {
  summary(_req: Request, res: Response): void {
    sendSuccess(res, analyticsService.summary());
  },

  byCountry(_req: Request, res: Response): void {
    sendSuccess(res, analyticsService.byCountry());
  },

  byDepartment(_req: Request, res: Response): void {
    sendSuccess(res, analyticsService.byDepartment());
  },

  distribution(_req: Request, res: Response): void {
    sendSuccess(res, analyticsService.distribution());
  },

  topEarners(req: Request, res: Response): void {
    const limit = Number(req.query.limit ?? 10);
    sendSuccess(res, analyticsService.topEarners(limit));
  },
};
