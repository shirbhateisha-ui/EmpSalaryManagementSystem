import { useEffect, useRef, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getApiBaseUrl } from '@/types/api.types';
import { clearCredentials, setAuthLoading, setCredentials } from '../store/auth.slice';
import type { User } from '../types/auth.types';

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const base = getApiBaseUrl();

    const restore = async () => {
      dispatch(setAuthLoading());
      try {
        const refreshRes = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          dispatch(clearCredentials());
          return;
        }

        const refreshBody = (await refreshRes.json()) as { data: { accessToken: string } };
        const accessToken = refreshBody.data.accessToken;

        const meRes = await fetch(`${base}/auth/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!meRes.ok) {
          dispatch(clearCredentials());
          return;
        }

        const meBody = (await meRes.json()) as { data: User };
        dispatch(setCredentials({ accessToken, user: meBody.data }));
      } catch {
        dispatch(clearCredentials());
      }
    };

    void restore();
  }, [dispatch]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
