import { Navigate, Outlet } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/auth.types';

interface RoleGuardProps {
  allowedRoles: Role[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
