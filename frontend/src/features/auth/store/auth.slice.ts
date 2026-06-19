import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types/auth.types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
    setAuthLoading(state) {
      state.status = 'loading';
    },
    // Used by baseQueryWithReauth for silent token rotation (no user fetch needed)
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAuthLoading, setAccessToken } =
  authSlice.actions;
