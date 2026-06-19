export interface SalaryRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
  created_at: string;
}

export interface AddSalaryInput {
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
}
