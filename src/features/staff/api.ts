import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { paginated, staffSchema } from '@bareeq/shared';
import type { createStaffSchema, updateStaffSchema } from '@bareeq/shared';

import { apiFetch } from '@/lib/api';
import type { QueryParams } from '@/lib/api';
import { toastSuccess } from '@/lib/forms';
import { invalidate, staffKeys } from '@/lib/queryKeys';

export function useStaff(q: QueryParams) {
  return useQuery({
    queryKey: staffKeys.list(q),
    queryFn: ({ signal }) =>
      apiFetch('/staff', { query: q, schema: paginated(staffSchema), signal }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createStaffSchema>) =>
      apiFetch('/staff', { method: 'POST', body, schema: staffSchema }),
    onSuccess: () => {
      invalidate(qc, staffKeys.all);
      toastSuccess('staff.created');
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateStaffSchema> }) =>
      apiFetch(`/staff/${id}`, { method: 'PATCH', body, schema: staffSchema }),
    onSuccess: () => {
      invalidate(qc, staffKeys.all);
      toastSuccess('staff.updated');
    },
  });
}
