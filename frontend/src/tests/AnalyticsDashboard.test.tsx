import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/store/auth.slice';
import { baseApi } from '@/services/baseQuery';
import type { AuthState } from '@/features/auth/store/auth.slice';

vi.mock('@/features/analytics/api/analytics.api', () => ({
  useGetSummaryQuery: vi.fn(),
  useGetByCountryQuery: vi.fn(),
  useGetByDepartmentQuery: vi.fn(),
  useGetDistributionQuery: vi.fn(),
  useGetTopEarnersQuery: vi.fn(),
  analyticsApi: { reducerPath: 'analyticsApi', reducer: () => ({}) },
}));

import {
  useGetSummaryQuery,
  useGetByCountryQuery,
  useGetByDepartmentQuery,
  useGetDistributionQuery,
  useGetTopEarnersQuery,
} from '@/features/analytics/api/analytics.api';

import AnalyticsPage from '@/features/analytics/pages/AnalyticsPage';
import type {
  SalarySummary,
  CountryPayroll,
  DepartmentPayroll,
  SalaryBand,
  TopEarner,
} from '@/features/analytics/types/analytics.types';

const mockSummary = useGetSummaryQuery as ReturnType<typeof vi.fn>;
const mockByCountry = useGetByCountryQuery as ReturnType<typeof vi.fn>;
const mockByDept = useGetByDepartmentQuery as ReturnType<typeof vi.fn>;
const mockDist = useGetDistributionQuery as ReturnType<typeof vi.fn>;
const mockTopEarners = useGetTopEarnersQuery as ReturnType<typeof vi.fn>;

function makeStore(authOverride: Partial<AuthState> = {}) {
  const auth: AuthState = {
    accessToken: 'tok',
    user: { id: 1, name: 'Admin', email: 'a@test.com', role: 'ADMIN', status: 'active' },
    status: 'authenticated',
    ...authOverride,
  };
  return configureStore({
    reducer: { auth: authSlice.reducer, [baseApi.reducerPath]: baseApi.reducer },
    preloadedState: { auth },
    middleware: (m) => m().concat(baseApi.middleware),
  });
}

function renderPage() {
  return render(
    <Provider store={makeStore()}>
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>
    </Provider>,
  );
}

const SUMMARY: SalarySummary = {
  headcount: 50,
  total_annual_usd: 4_000_000,
  total_monthly_usd: 333_333,
  avg_annual_usd: 80_000,
  min_annual_usd: 30_000,
  max_annual_usd: 200_000,
};

const COUNTRIES: CountryPayroll[] = [
  { country: 'US', headcount: 30, total_annual_usd: 2_500_000, avg_annual_usd: 83_333 },
  { country: 'UK', headcount: 20, total_annual_usd: 1_500_000, avg_annual_usd: 75_000 },
];

const DEPARTMENTS: DepartmentPayroll[] = [
  { department: 'Engineering', headcount: 25, total_annual_usd: 2_200_000, avg_annual_usd: 88_000 },
  { department: 'HR', headcount: 10, total_annual_usd: 700_000, avg_annual_usd: 70_000 },
];

const BANDS: SalaryBand[] = [
  { band: 'Under $30k', min_usd: 0, max_usd: 30000, headcount: 2 },
  { band: '$30k–$60k', min_usd: 30000, max_usd: 60000, headcount: 10 },
  { band: '$60k–$90k', min_usd: 60000, max_usd: 90000, headcount: 20 },
  { band: '$90k–$120k', min_usd: 90000, max_usd: 120000, headcount: 12 },
  { band: '$120k–$150k', min_usd: 120000, max_usd: 150000, headcount: 4 },
  { band: 'Over $150k', min_usd: 150000, max_usd: null, headcount: 2 },
];

const EARNERS: TopEarner[] = [
  {
    id: 1,
    name: 'Alice Top',
    department: 'Engineering',
    country: 'US',
    annual_usd: 200_000,
    monthly_usd: 16_666,
  },
  {
    id: 2,
    name: 'Bob Second',
    department: 'HR',
    country: 'UK',
    annual_usd: 150_000,
    monthly_usd: 12_500,
  },
];

function mockAll(
  overrides: Partial<{
    summaryLoading: boolean;
    summaryError: boolean;
    summaryData: SalarySummary | null;
  }> = {},
) {
  const loading = overrides.summaryLoading ?? false;
  const error = overrides.summaryError ?? false;
  const data = overrides.summaryData ?? SUMMARY;

  mockSummary.mockReturnValue({
    isLoading: loading,
    isError: error,
    data: data ?? undefined,
    refetch: vi.fn(),
  });
  mockByCountry.mockReturnValue({
    isLoading: loading,
    isError: error,
    data: loading || error ? undefined : COUNTRIES,
    refetch: vi.fn(),
  });
  mockByDept.mockReturnValue({
    isLoading: loading,
    isError: error,
    data: loading || error ? undefined : DEPARTMENTS,
    refetch: vi.fn(),
  });
  mockDist.mockReturnValue({
    isLoading: loading,
    isError: error,
    data: loading || error ? undefined : BANDS,
    refetch: vi.fn(),
  });
  mockTopEarners.mockReturnValue({
    isLoading: loading,
    isError: error,
    data: loading || error ? undefined : EARNERS,
    refetch: vi.fn(),
  });
}

describe('AnalyticsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state', () => {
    mockAll({ summaryLoading: true });
    renderPage();
    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockAll({ summaryError: true });
    renderPage();
    expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
  });

  it('renders empty state when headcount is 0', () => {
    mockAll({ summaryData: { ...SUMMARY, headcount: 0 } });
    renderPage();
    expect(screen.getByText(/no payroll data yet/i)).toBeInTheDocument();
  });

  it('renders KPI cards with correct values', () => {
    mockAll();
    renderPage();
    expect(screen.getByText('50')).toBeInTheDocument(); // headcount
    expect(screen.getByText(/\$80,000/)).toBeInTheDocument(); // avg salary
    expect(screen.getByText(/\$30,000/)).toBeInTheDocument(); // min salary
    // max salary appears in KPI card and earner table — just assert at least one exists
    expect(screen.getAllByText(/\$200,000/).length).toBeGreaterThan(0);
  });

  it('renders country bar chart entries', () => {
    mockAll();
    renderPage();
    // US/UK appear in chart and earner table — assert at least one match
    expect(screen.getAllByText('US').length).toBeGreaterThan(0);
    expect(screen.getAllByText('UK').length).toBeGreaterThan(0);
  });

  it('renders department bar chart entries', () => {
    mockAll();
    renderPage();
    expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HR').length).toBeGreaterThan(0);
  });

  it('renders distribution bands', () => {
    mockAll();
    renderPage();
    expect(screen.getAllByText('$60k–$90k').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Over $150k').length).toBeGreaterThan(0);
  });

  it('renders top earners table', () => {
    mockAll();
    renderPage();
    expect(screen.getByText('Alice Top')).toBeInTheDocument();
    expect(screen.getByText('Bob Second')).toBeInTheDocument();
  });

  it('renders insights panel', () => {
    mockAll();
    renderPage();
    expect(screen.getByText(/monthly payroll spend/i)).toBeInTheDocument();
    expect(screen.getByText(/highest payroll cost/i)).toBeInTheDocument();
    expect(screen.getByText(/average salary by department/i)).toBeInTheDocument();
    expect(screen.getByText(/top 10 highest paid/i)).toBeInTheDocument();
    expect(screen.getByText(/salaries distributed across bands/i)).toBeInTheDocument();
  });
});
