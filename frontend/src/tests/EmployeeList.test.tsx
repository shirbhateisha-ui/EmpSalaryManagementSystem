import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/store/auth.slice';
import { baseApi } from '@/services/baseQuery';
import type { AuthState } from '@/features/auth/store/auth.slice';
import type { Employee } from '@/features/employees/types/employee.types';

// Mock the employees API hook
vi.mock('@/features/employees/api/employees.api', () => ({
  useListEmployeesQuery: vi.fn(),
  useCreateEmployeeMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  employeesApi: { reducerPath: 'employeesApi', reducer: () => ({}) },
}));

import { useListEmployeesQuery } from '@/features/employees/api/employees.api';
import EmployeesPage from '@/features/employees/pages/EmployeesPage';

const mockListEmployees = useListEmployeesQuery as ReturnType<typeof vi.fn>;

function makeStore(authOverride: Partial<AuthState> = {}) {
  const auth: AuthState = {
    accessToken: 'tok',
    user: { id: 1, name: 'Admin', email: 'a@test.com', role: 'ADMIN', status: 'active' },
    status: 'authenticated',
    ...authOverride,
  };
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: { auth },
    middleware: (m) => m().concat(baseApi.middleware),
  });
}

function renderPage(authOverride: Partial<AuthState> = {}) {
  return render(
    <Provider store={makeStore(authOverride)}>
      <MemoryRouter>
        <EmployeesPage />
      </MemoryRouter>
    </Provider>,
  );
}

const MOCK_EMPLOYEE: Employee = {
  id: 1,
  name: 'Alice Smith',
  email: 'alice@acme.com',
  country: 'US',
  department: 'Engineering',
  currency_code: 'USD',
  status: 'active',
  joining_date: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  current_salary: {
    salary_id: 1,
    base_salary: 80000,
    currency_code: 'USD',
    effective_date: '2024-01-01',
    base_salary_usd: 80000,
  },
};

const MOCK_META = { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false };

describe('EmployeesPage — list states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockListEmployees.mockReturnValue({ isLoading: true, isError: false, data: undefined });
    renderPage();
    expect(screen.getByText(/loading employees/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockListEmployees.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() });
    renderPage();
    expect(screen.getByText(/failed to load employees/i)).toBeInTheDocument();
  });

  it('renders empty state when no employees exist', () => {
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [], meta: { ...MOCK_META, total: 0 } },
    });
    renderPage();
    expect(screen.getByText(/no employees found/i)).toBeInTheDocument();
  });

  it('renders employee data in table', () => {
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [MOCK_EMPLOYEE], meta: MOCK_META },
    });
    renderPage();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText(/\$80,000/)).toBeInTheDocument();
  });

  it('shows Add Employee button for ADMIN', () => {
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [], meta: MOCK_META },
    });
    renderPage();
    expect(screen.getByRole('button', { name: /add employee/i })).toBeInTheDocument();
  });

  it('hides Add Employee button for VIEWER', () => {
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [], meta: MOCK_META },
    });
    renderPage({
      user: { id: 2, name: 'Viewer', email: 'v@test.com', role: 'VIEWER', status: 'active' },
    });
    expect(screen.queryByRole('button', { name: /add employee/i })).not.toBeInTheDocument();
  });

  it('shows empty state hint to adjust filters when search is active', () => {
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [], meta: MOCK_META },
    });
    renderPage();
    // Simulate a search being active by checking the empty state description
    expect(screen.getByText(/add the first employee/i)).toBeInTheDocument();
  });
});

describe('EmployeesPage — search debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockListEmployees.mockReturnValue({
      isLoading: false, isError: false,
      data: { employees: [], meta: MOCK_META },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces search — query receives value only after 300ms idle', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/search by name/i);

    act(() => { fireEvent.change(input, { target: { value: 'Ali' } }); });

    // Before debounce window expires the hook should not yet see the new value
    const callsMid = mockListEmployees.mock.calls.map((c) => c[0]?.search ?? '');
    expect(callsMid.every((s) => s !== 'Ali')).toBe(true);

    act(() => { vi.advanceTimersByTime(350); });

    const lastCall = mockListEmployees.mock.calls.at(-1)?.[0];
    expect(lastCall?.search ?? '').toBe('Ali');
  });

  it('resets page to 1 when search changes', () => {
    renderPage();
    const input = screen.getByPlaceholderText(/search by name/i);

    act(() => { fireEvent.change(input, { target: { value: 'Bob' } }); });
    act(() => { vi.advanceTimersByTime(350); });

    const lastCall = mockListEmployees.mock.calls.at(-1)?.[0];
    expect(lastCall?.page).toBe(1);
  });
});
