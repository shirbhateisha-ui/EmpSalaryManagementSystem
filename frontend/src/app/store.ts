import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '@/features/auth/store/auth.slice';
import { baseApi } from '@/services/baseQuery';
import { systemApi } from '@/services/systemApi';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [systemApi.reducerPath]: systemApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, systemApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
