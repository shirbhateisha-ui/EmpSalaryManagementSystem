import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiSuccessResponse, HealthData } from '@/types/api.types';
import { getApiOrigin } from '@/types/api.types';

export const systemApi = createApi({
  reducerPath: 'systemApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiOrigin(),
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getHealth: builder.query<ApiSuccessResponse<HealthData>, void>({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = systemApi;
