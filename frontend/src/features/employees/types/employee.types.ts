export type EmployeeStatus = 'active' | 'inactive';
export type EmployeeSortField =
  | 'name'
  | 'department'
  | 'country'
  | 'joining_date'
  | 'base_salary_usd'
  | 'created_at';

export interface CurrentSalary {
  salary_id: number;
  base_salary: number;
  currency_code: string;
  effective_date: string;
  base_salary_usd: number;
}

export interface Employee {
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
  current_salary: CurrentSalary | null;
}

export interface SalaryRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
  created_at: string;
  base_salary_usd: number;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  country: string;
  department: string;
  currency_code: string;
  joining_date: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  country?: string;
  department?: string;
  currency_code?: string;
  joining_date?: string;
  status?: EmployeeStatus;
}

export interface AddRaiseRequest {
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
}

export interface EmployeeFilters {
  search?: string;
  country?: string;
  department?: string;
  status?: EmployeeStatus | '';
  sort?: EmployeeSortField;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
