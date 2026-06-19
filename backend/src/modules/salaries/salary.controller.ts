import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils.js';
import { salaryService } from './salary.service.js';

export const salaryController = {
  list(req: Request, res: Response): void {
    const salaries = salaryService.listByEmployee(Number(req.params.id));
    sendSuccess(res, salaries);
  },

  create(req: Request, res: Response): void {
    const salary = salaryService.addSalary(Number(req.params.id), req.body);
    sendSuccess(res, salary, { status: 201 });
  },
};
