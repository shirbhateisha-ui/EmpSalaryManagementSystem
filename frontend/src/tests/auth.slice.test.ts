import { describe, it, expect } from 'vitest';
import {
  authSlice,
  setCredentials,
  clearCredentials,
  setAuthLoading,
  setAccessToken,
} from '@/features/auth/store/auth.slice';
import type { AuthState } from '@/features/auth/store/auth.slice';
import type { User } from '@/features/auth/types/auth.types';

const mockUser: User = {
  id: 1,
  name: 'Test Admin',
  email: 'admin@acme.com',
  role: 'ADMIN',
  status: 'active',
};

const reducer = authSlice.reducer;

describe('auth slice', () => {
  it('has correct initial state', () => {
    const state = reducer(undefined, { type: '@@init' });
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('setCredentials sets token, user, and authenticated status', () => {
    const state = reducer(undefined, setCredentials({ accessToken: 'tok123', user: mockUser }));
    expect(state.accessToken).toBe('tok123');
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe('authenticated');
  });

  it('clearCredentials resets everything to unauthenticated', () => {
    const prev: AuthState = { accessToken: 'tok', user: mockUser, status: 'authenticated' };
    const state = reducer(prev, clearCredentials());
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
  });

  it('setAuthLoading sets status to loading without touching token/user', () => {
    const prev: AuthState = { accessToken: 'tok', user: mockUser, status: 'authenticated' };
    const state = reducer(prev, setAuthLoading());
    expect(state.status).toBe('loading');
    expect(state.accessToken).toBe('tok');
    expect(state.user).toEqual(mockUser);
  });

  it('setAccessToken updates token only', () => {
    const prev: AuthState = { accessToken: 'old', user: mockUser, status: 'authenticated' };
    const state = reducer(prev, setAccessToken('new-tok'));
    expect(state.accessToken).toBe('new-tok');
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe('authenticated');
  });
});
