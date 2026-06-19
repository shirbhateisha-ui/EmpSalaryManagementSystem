import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response.utils.js';
import { employeeService } from './employee.service.js';

export const employeeController = {
  list(req: Request, res: Response): void {
    const result = employeeService.list(req.query as Record<string, unknown>);
    sendSuccess(res, result.employees, { meta: result.meta });
  },

  get(req: Request, res: Response): void {
    const employee = employeeService.get(Number(req.params.id));
    sendSuccess(res, employee);
  },

  create(req: Request, res: Response): void {
    const employee = employeeService.create(req.body);
    sendSuccess(res, employee, { status: 201 });
  },

  update(req: Request, res: Response): void {
    const employee = employeeService.update(Number(req.params.id), req.body);
    sendSuccess(res, employee);
  },
};
