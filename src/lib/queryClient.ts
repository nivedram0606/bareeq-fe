import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry only transient failures (network / 5xx), never 4xx.
      retry: (failureCount, error) =>
        failureCount < 2 && (!isApiError(error) || error.status === 0 || error.status >= 500),
    },
    mutations: { retry: false },
  },
});
