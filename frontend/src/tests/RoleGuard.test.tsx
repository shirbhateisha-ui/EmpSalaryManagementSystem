import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/store/auth.slice';
import type { AuthState } from '@/features/auth/store/auth.slice';
import { baseApi } from '@/services/baseQuery';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import type { User } from '@/features/auth/types/auth.types';

const adminUser: User = {
  id: 1, name: 'Admin', email: 'admin@acme.com', role: 'ADMIN', status: 'active',
};

const viewerUser: User = {
  id: 2, name: 'Viewer', email: 'viewer@acme.com', role: 'VIEWER', status: 'active',
};

function makeStore(user: User | null) {
  const auth: AuthState = {
    accessToken: user ? 'tok' : null,
    user,
    status: user ? 'authenticated' : 'unauthenticated',
  };
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

function buildRouter(user: User | null) {
  return (
    <Provider store={makeStore(user)}>
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<div>Users Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('RoleGuard', () => {
  it('renders children for a user with the required role', () => {
    render(buildRouter(adminUser));
    expect(screen.getByText('Users Admin')).toBeInTheDocument();
  });

  it('shows access denied for a user with insufficient role', () => {
    render(buildRouter(viewerUser));
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Users Admin')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', async () => {
    render(buildRouter(null));
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Users Admin')).not.toBeInTheDocument();
  });
});
