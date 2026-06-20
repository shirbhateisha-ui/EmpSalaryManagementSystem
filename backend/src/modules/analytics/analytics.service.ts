import { analyticsRepository } from './analytics.repository.js';
import type {
  SalaryBand,
  SalarySummary,
  TopEarner,
  CountryPayroll,
  DepartmentPayroll,
} from './analytics.types.js';

const BANDS: Omit<SalaryBand, 'headcount'>[] = [
  { band: 'Under $30k', min_usd: 0, max_usd: 30000 },
  { band: '$30k–$60k', min_usd: 30000, max_usd: 60000 },
  { band: '$60k–$90k', min_usd: 60000, max_usd: 90000 },
  { band: '$90k–$120k', min_usd: 90000, max_usd: 120000 },
  { band: '$120k–$150k', min_usd: 120000, max_usd: 150000 },
  { band: 'Over $150k', min_usd: 150000, max_usd: null },
];

export const analyticsService = {
  summary(): SalarySummary {
    const raw = analyticsRepository.summary();
    return {
      headcount: raw.headcount,
      total_annual_usd: raw.total_annual_usd,
      total_monthly_usd: raw.total_annual_usd / 12,
      avg_annual_usd: raw.avg_annual_usd,
      min_annual_usd: raw.min_annual_usd,
      max_annual_usd: raw.max_annual_usd,
    };
  },

  byCountry(): CountryPayroll[] {
    return analyticsRepository.byCountry();
  },

  byDepartment(): DepartmentPayroll[] {
    return analyticsRepository.byDepartment();
  },

  distribution(): SalaryBand[] {
    const counts = analyticsRepository.distributionCounts();
    const countMap = new Map(counts.map((r) => [r.band_index, r.headcount]));

    return BANDS.map((band, index) => ({
      ...band,
      headcount: countMap.get(index) ?? 0,
    }));
  },

  topEarners(limit: number): TopEarner[] {
    return analyticsRepository.topEarners(limit);
  },
};
