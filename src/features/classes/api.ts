import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { academicYearSchema, classSchema, paginated } from '@bareeq/shared';
import type { createClassSchema, updateClassSchema } from '@bareeq/shared';

import { apiFetch } from '@/lib/api';
import type { QueryParams } from '@/lib/api';
import { toastSuccess } from '@/lib/forms';
import { classKeys, invalidate, reportKeys, studentKeys, yearKeys } from '@/lib/queryKeys';

export function useClasses(q: QueryParams) {
  return useQuery({
    queryKey: classKeys.list(q),
    queryFn: ({ signal }) =>
      apiFetch('/classes', { query: q, schema: paginated(classSchema), signal }),
    placeholderData: keepPreviousData,
  });
}

/** Every class (for dropdowns). Pilot schools have well under 100 classes. */
export function useClassOptions() {
  return useClasses({ pageSize: 100 });
}

export function useAcademicYears(q: QueryParams = { pageSize: 100 }) {
  return useQuery({
    queryKey: yearKeys.list(q),
    queryFn: ({ signal }) =>
      apiFetch('/academic-years', { query: q, schema: paginated(academicYearSchema), signal }),
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createClassSchema>) =>
      apiFetch('/classes', { method: 'POST', body, schema: classSchema }),
    onSuccess: () => {
      invalidate(qc, classKeys.all);
      toastSuccess('classes.created');
    },
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateClassSchema> }) =>
      apiFetch(`/classes/${id}`, { method: 'PATCH', body, schema: classSchema }),
    onSuccess: () => {
      invalidate(qc, classKeys.all, studentKeys.all, reportKeys.all);
      toastSuccess('classes.updated');
    },
  });
}
