import { useAppSelector } from '@/app/hooks';

export function useAuth() {
  const { accessToken, user, status } = useAppSelector((s) => s.auth);
  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'idle' || status === 'loading',
    accessToken,
    status,
  };
}
