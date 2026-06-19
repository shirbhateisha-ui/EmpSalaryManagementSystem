import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import LoginPage from '@/features/auth/pages/LoginPage';
import UsersPage from '@/features/users/pages/UsersPage';
import EmployeesPage from '@/features/employees/pages/EmployeesPage';
import EmployeeDetailPage from '@/features/employees/pages/EmployeeDetailPage';
import DashboardPage from '@/pages/DashboardPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'employees',    element: <EmployeesPage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'analytics',   element: <AnalyticsPage /> },
          {
            element: <RoleGuard allowedRoles={['ADMIN']} />,
            children: [{ path: 'users', element: <UsersPage /> }],
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
