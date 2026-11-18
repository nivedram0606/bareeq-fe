import { useQuery } from '@tanstack/react-query';

import { dashboardSchema } from '@bareeq/shared';

import { apiFetch } from '@/lib/api';
import { dashboardKeys } from '@/lib/queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => apiFetch('/dashboard', { schema: dashboardSchema, signal }),
  });
}
