import { ConflictError, NotFoundError } from '../../shared/errors/AppError.js';
import { buildPaginationMeta, parsePaginationQuery } from '../../shared/utils/pagination.utils.js';
import type { PaginationMeta } from '../../shared/utils/response.utils.js';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from './employee.types.js';
import { employeeRepository } from './employee.repository.js';

export interface CreateEmployeeDto extends CreateEmployeeInput {}
export interface UpdateEmployeeDto extends UpdateEmployeeInput {}

export const employeeService = {
  list(query: Record<string, unknown>): { employees: Employee[]; meta: PaginationMeta } {
    const { page, limit, offset } = parsePaginationQuery(query);

    const { employees, total } = employeeRepository.list({
      page,
      limit,
      offset,
      search: query.search as string | undefined,
      department: query.department as string | undefined,
      country: query.country as string | undefined,
      status: query.status as 'active' | 'inactive' | undefined,
      sort: query.sort as 'name' | 'department' | 'country' | 'joining_date' | 'base_salary_usd' | 'created_at' | undefined,
      order: query.order as 'asc' | 'desc' | undefined,
    });

    return { employees, meta: buildPaginationMeta({ page, limit, total }) };
  },

  get(id: number): Employee {
    const employee = employeeRepository.findById(id);
    if (!employee) throw new NotFoundError('Employee not found');
    return employee;
  },

  create(input: CreateEmployeeDto): Employee {
    const existing = employeeRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('Email is already registered to another employee');
    return employeeRepository.create(input);
  },

  update(id: number, input: UpdateEmployeeDto): Employee {
    const existing = employeeRepository.findById(id);
    if (!existing) throw new NotFoundError('Employee not found');

    if (input.email && input.email.toLowerCase() !== existing.email) {
      const taken = employeeRepository.findByEmail(input.email);
      if (taken) throw new ConflictError('Email is already registered to another employee');
    }

    const updated = employeeRepository.update(id, input);
    if (!updated) throw new NotFoundError('Employee not found');
    return updated;
  },
};
