import { NotFoundError } from '../../shared/errors/AppError.js';
import { employeeRepository } from '../employees/employee.repository.js';
import { salaryRepository } from './salary.repository.js';
import type { AddSalaryInput, SalaryRecord } from './salary.types.js';

export const salaryService = {
  listByEmployee(employeeId: number): SalaryRecord[] {
    const employee = employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    return salaryRepository.listByEmployee(employeeId);
  },

  addSalary(employeeId: number, input: AddSalaryInput): SalaryRecord {
    const employee = employeeRepository.findById(employeeId);
    if (!employee) throw new NotFoundError('Employee not found');
    return salaryRepository.create(employeeId, input);
  },
};
