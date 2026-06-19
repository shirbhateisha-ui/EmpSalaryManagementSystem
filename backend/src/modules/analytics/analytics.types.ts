export interface SalarySummary {
  headcount: number;
  total_annual_usd: number;
  total_monthly_usd: number;
  avg_annual_usd: number;
  min_annual_usd: number;
  max_annual_usd: number;
}

export interface CountryPayroll {
  country: string;
  headcount: number;
  total_annual_usd: number;
  avg_annual_usd: number;
}

export interface DepartmentPayroll {
  department: string;
  headcount: number;
  total_annual_usd: number;
  avg_annual_usd: number;
}

export interface SalaryBand {
  band: string;
  min_usd: number;
  max_usd: number | null;
  headcount: number;
}

export interface TopEarner {
  id: number;
  name: string;
  department: string;
  country: string;
  annual_usd: number;
  monthly_usd: number;
}
