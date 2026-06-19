import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/store/auth.slice';
import { baseApi } from '@/services/baseQuery';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import type { AuthState } from '@/features/auth/store/auth.slice';

function makeStore(authState: Partial<AuthState>) {
  const auth: AuthState = { accessToken: null, user: null, status: 'idle', ...authState };
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: { auth },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

function buildRouter(authState: Partial<AuthState>) {
  return (
    <Provider store={makeStore(authState)}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('AuthGuard', () => {
  it('redirects unauthenticated users to /login', async () => {
    render(buildRouter({ status: 'unauthenticated' }));
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content for authenticated users', () => {
    render(buildRouter({ status: 'authenticated', accessToken: 'tok' }));
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders nothing while auth status is loading', () => {
    render(buildRouter({ status: 'loading' }));
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
