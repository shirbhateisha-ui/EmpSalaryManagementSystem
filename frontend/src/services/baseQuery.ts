import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {
  clearCredentials,
  setAccessToken,
} from '@/features/auth/store/auth.slice';
import type { ApiSuccessResponse } from '@/types/api.types';
import { getApiBaseUrl } from '@/types/api.types';
import type { RootState } from '@/app/store';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl(),
  credentials: 'include',
  prepareHeaders(headers, { getState }) {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    const refreshData = refreshResult.data as ApiSuccessResponse<{ accessToken: string }> | undefined;

    if (refreshData?.success && refreshData.data.accessToken) {
      api.dispatch(setAccessToken(refreshData.data.accessToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users', 'Employees', 'Analytics'],
  endpoints: () => ({}),
});
