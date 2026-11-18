import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { guardianSchema, paginated, studentSchema } from '@bareeq/shared';
import type {
  createGuardianSchema,
  createStudentSchema,
  updateGuardianSchema,
  updateStudentSchema,
} from '@bareeq/shared';

import { apiFetch } from '@/lib/api';
import type { QueryParams } from '@/lib/api';
import { toastSuccess } from '@/lib/forms';
import { classKeys, dashboardKeys, invalidate, reportKeys, studentKeys } from '@/lib/queryKeys';

export { studentKeys };

export function useStudents(q: QueryParams) {
  return useQuery({
    queryKey: studentKeys.list(q),
    queryFn: ({ signal }) =>
      apiFetch('/students', { query: q, schema: paginated(studentSchema), signal }),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: ({ signal }) => apiFetch(`/students/${id}`, { schema: studentSchema, signal }),
    enabled: Boolean(id),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createStudentSchema>) =>
      apiFetch('/students', { method: 'POST', body, schema: studentSchema }),
    onSuccess: () => {
      invalidate(qc, studentKeys.all, classKeys.all, reportKeys.all, dashboardKeys.all);
      toastSuccess('students.created');
    },
  });
}

export function useUpdateStudent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof updateStudentSchema>) =>
      apiFetch(`/students/${id}`, { method: 'PATCH', body, schema: studentSchema }),
    onSuccess: (student) => {
      qc.setQueryData(studentKeys.detail(id), student);
      invalidate(qc, studentKeys.all, classKeys.all, reportKeys.all, dashboardKeys.all);
      toastSuccess('students.updated');
    },
  });
}

/* --------------------------------------------------------------- guardians */

export function useGuardians(studentId: string) {
  return useQuery({
    queryKey: studentKeys.guardians(studentId),
    queryFn: ({ signal }) =>
      apiFetch(`/students/${studentId}/guardians`, { schema: z.array(guardianSchema), signal }),
  });
}

/** Guardian changes can change the student's primary contact shown in lists and reports. */
function onGuardianChange(qc: ReturnType<typeof useQueryClient>, studentId: string) {
  invalidate(qc, studentKeys.guardians(studentId), studentKeys.all, reportKeys.all);
}

export function useCreateGuardian(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createGuardianSchema>) =>
      apiFetch(`/students/${studentId}/guardians`, {
        method: 'POST',
        body,
        schema: guardianSchema,
      }),
    onSuccess: () => {
      onGuardianChange(qc, studentId);
      toastSuccess('guardians.created');
    },
  });
}

export function useUpdateGuardian(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateGuardianSchema> }) =>
      apiFetch(`/guardians/${id}`, { method: 'PATCH', body, schema: guardianSchema }),
    onSuccess: () => {
      onGuardianChange(qc, studentId);
      toastSuccess('guardians.updated');
    },
  });
}

export function useDeleteGuardian(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/guardians/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      onGuardianChange(qc, studentId);
      toastSuccess('guardians.deleted');
    },
  });
}
