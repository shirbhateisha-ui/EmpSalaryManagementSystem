import type { ApiSuccessResponse } from '@/types/api.types';
import { baseApi } from '@/services/baseQuery';
import { clearCredentials, setCredentials } from '../store/auth.slice';
import type { LoginRequest, LoginResponse, RefreshResponse, User } from '../types/auth.types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (res: ApiSuccessResponse<LoginResponse>) => res.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }));
        } catch {
          // error surface is handled by the caller (LoginForm)
        }
      },
    }),

    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
        }
      },
    }),

    // Refresh is called by baseQueryWithReauth; no onQueryStarted here so callers
    // have full control over what to dispatch after rotation.
    refresh: build.mutation<RefreshResponse, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
      transformResponse: (res: ApiSuccessResponse<RefreshResponse>) => res.data,
    }),

    me: build.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (res: ApiSuccessResponse<User>) => res.data,
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
