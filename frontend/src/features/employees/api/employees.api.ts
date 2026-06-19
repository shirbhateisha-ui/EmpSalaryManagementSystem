import type { ApiSuccessResponse, PaginationMeta } from '@/types/api.types';
import { baseApi } from '@/services/baseQuery';
import type {
  AddRaiseRequest,
  CreateEmployeeRequest,
  Employee,
  EmployeeFilters,
  SalaryRecord,
  UpdateEmployeeRequest,
} from '../types/employee.types';

export interface EmployeesListResult {
  employees: Employee[];
  meta: PaginationMeta;
}

function buildQuery(filters: EmployeeFilters): string {
  const params = new URLSearchParams();
  if (filters.search)     params.set('search', filters.search);
  if (filters.country)    params.set('country', filters.country);
  if (filters.department) params.set('department', filters.department);
  if (filters.status)     params.set('status', filters.status);
  if (filters.sort)       params.set('sort', filters.sort);
  if (filters.order)      params.set('order', filters.order);
  params.set('page',  String(filters.page  ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  return `/employees?${params.toString()}`;
}

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listEmployees: build.query<EmployeesListResult, EmployeeFilters>({
      query: (filters) => buildQuery(filters),
      transformResponse: (res: ApiSuccessResponse<Employee[]>) => ({
        employees: res.data,
        meta: res.meta as PaginationMeta,
      }),
      providesTags: ['Employees'],
    }),

    getEmployee: build.query<Employee, number>({
      query: (id) => `/employees/${id}`,
      transformResponse: (res: ApiSuccessResponse<Employee>) => res.data,
      providesTags: (_result, _err, id) => [{ type: 'Employees', id }],
    }),

    createEmployee: build.mutation<Employee, CreateEmployeeRequest>({
      query: (body) => ({ url: '/employees', method: 'POST', body }),
      transformResponse: (res: ApiSuccessResponse<Employee>) => res.data,
      invalidatesTags: ['Employees'],
    }),

    updateEmployee: build.mutation<Employee, { id: number; body: UpdateEmployeeRequest }>({
      query: ({ id, body }) => ({ url: `/employees/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiSuccessResponse<Employee>) => res.data,
      invalidatesTags: (_result, _err, { id }) => ['Employees', { type: 'Employees', id }],
    }),

    getEmployeeSalaries: build.query<SalaryRecord[], number>({
      query: (id) => `/employees/${id}/salaries`,
      transformResponse: (res: ApiSuccessResponse<SalaryRecord[]>) => res.data,
      providesTags: (_result, _err, id) => [{ type: 'Employees', id }],
    }),

    addSalary: build.mutation<SalaryRecord, { employeeId: number; body: AddRaiseRequest }>({
      query: ({ employeeId, body }) => ({
        url: `/employees/${employeeId}/salaries`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: ApiSuccessResponse<SalaryRecord>) => res.data,
      invalidatesTags: (_result, _err, { employeeId }) => [{ type: 'Employees', id: employeeId }],
    }),
  }),
});

export const {
  useListEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeSalariesQuery,
  useAddSalaryMutation,
} = employeesApi;
