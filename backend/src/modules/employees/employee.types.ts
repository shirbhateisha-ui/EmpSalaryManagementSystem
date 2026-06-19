export type EmployeeStatus = 'active' | 'inactive';

export interface EmployeeRecord {
  id: number;
  name: string;
  email: string;
  country: string;
  department: string;
  currency_code: string;
  status: EmployeeStatus;
  joining_date: string;
  created_at: string;
  updated_at: string;
}

export interface CurrentSalary {
  salary_id: number;
  base_salary: number;
  currency_code: string;
  effective_date: string;
  base_salary_usd: number;
}

export interface Employee extends EmployeeRecord {
  current_salary: CurrentSalary | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  country: string;
  department: string;
  currency_code: string;
  joining_date: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  country?: string;
  department?: string;
  currency_code?: string;
  joining_date?: string;
  status?: EmployeeStatus;
}

export type EmployeeSortField =
  | 'name'
  | 'department'
  | 'country'
  | 'joining_date'
  | 'base_salary_usd'
  | 'created_at';

export interface ListEmployeesOptions {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  department?: string;
  country?: string;
  status?: EmployeeStatus;
  sort?: EmployeeSortField;
  order?: 'asc' | 'desc';
}
