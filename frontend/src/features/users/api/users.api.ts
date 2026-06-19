import type { ApiSuccessResponse, PaginationMeta } from '@/types/api.types';
import type { User } from '@/features/auth/types/auth.types';
import { baseApi } from '@/services/baseQuery';
import type { CreateUserRequest, UpdateUserRequest } from '../types/user.types';

export interface UsersListResult {
  users: User[];
  meta: PaginationMeta;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<UsersListResult, { page?: number; limit?: number } | void>({
      query: (params) => {
        const { page = 1, limit = 20 } = params ?? {};
        return `/users?page=${page}&limit=${limit}`;
      },
      transformResponse: (res: ApiSuccessResponse<User[]>) => ({
        users: res.data,
        meta: res.meta as PaginationMeta,
      }),
      providesTags: ['Users'],
    }),

    createUser: build.mutation<User, CreateUserRequest>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (res: ApiSuccessResponse<User>) => res.data,
      invalidatesTags: ['Users'],
    }),

    updateUser: build.mutation<User, { id: number; body: UpdateUserRequest }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      transformResponse: (res: ApiSuccessResponse<User>) => res.data,
      invalidatesTags: ['Users'],
    }),
  }),
});

export const { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation } = usersApi;
