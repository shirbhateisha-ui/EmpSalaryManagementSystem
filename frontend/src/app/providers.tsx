import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/app/store';
import { router } from '@/app/router';
import { AuthInitializer } from '@/features/auth/components/AuthInitializer';
import { Toaster } from '@/components/ui/toaster';

export function Providers() {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <RouterProvider router={router} />
        <Toaster />
      </AuthInitializer>
    </Provider>
  );
}
