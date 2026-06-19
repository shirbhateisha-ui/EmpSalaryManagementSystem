import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AuthGuard() {
  const { status } = useAuth();

  // AuthInitializer handles the loading spinner; by the time the router renders,
  // status is never 'idle' or 'loading' — but guard gracefully no-ops if it is.
  if (status === 'idle' || status === 'loading') return null;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
