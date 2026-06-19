export interface SalaryRecord {
  id: number;
  employee_id: number;
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
  created_at: string;
}

/** A salary row enriched with its USD-normalized amount (base_salary * rate_to_usd). */
export interface SalaryWithUsd extends SalaryRecord {
  base_salary_usd: number;
}

export interface AddSalaryInput {
  base_salary: number;
  currency_code: string;
  country: string;
  effective_date: string;
}
