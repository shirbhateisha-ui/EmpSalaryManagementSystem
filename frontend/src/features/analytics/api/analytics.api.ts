import type { ApiSuccessResponse } from '@/types/api.types';
import { baseApi } from '@/services/baseQuery';
import type {
  CountryPayroll,
  DepartmentPayroll,
  SalaryBand,
  SalarySummary,
  TopEarner,
} from '../types/analytics.types';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSummary: build.query<SalarySummary, void>({
      query: () => '/analytics/summary',
      transformResponse: (res: ApiSuccessResponse<SalarySummary>) => res.data,
      providesTags: ['Analytics'],
    }),

    getByCountry: build.query<CountryPayroll[], void>({
      query: () => '/analytics/by-country',
      transformResponse: (res: ApiSuccessResponse<CountryPayroll[]>) => res.data,
      providesTags: ['Analytics'],
    }),

    getByDepartment: build.query<DepartmentPayroll[], void>({
      query: () => '/analytics/by-department',
      transformResponse: (res: ApiSuccessResponse<DepartmentPayroll[]>) => res.data,
      providesTags: ['Analytics'],
    }),

    getDistribution: build.query<SalaryBand[], void>({
      query: () => '/analytics/distribution',
      transformResponse: (res: ApiSuccessResponse<SalaryBand[]>) => res.data,
      providesTags: ['Analytics'],
    }),

    getTopEarners: build.query<TopEarner[], number | void>({
      query: (limit = 10) => `/analytics/top-earners?limit=${limit}`,
      transformResponse: (res: ApiSuccessResponse<TopEarner[]>) => res.data,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetSummaryQuery,
  useGetByCountryQuery,
  useGetByDepartmentQuery,
  useGetDistributionQuery,
  useGetTopEarnersQuery,
} = analyticsApi;
