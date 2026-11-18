import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import { feeItemSchema, paymentSchema, studentFeesSchema } from '@bareeq/shared';
import type {
  createFeeSchema,
  createPaymentSchema,
  updateFeeSchema,
  voidPaymentSchema,
} from '@bareeq/shared';

import { apiFetch } from '@/lib/api';
import { toastSuccess } from '@/lib/forms';
import { dashboardKeys, invalidate, reportKeys, studentKeys } from '@/lib/queryKeys';

/** Fee items with balances (from the API's SQL view) and payment history for one student. */
export function useStudentFees(studentId: string) {
  return useQuery({
    queryKey: studentKeys.fees(studentId),
    queryFn: ({ signal }) =>
      apiFetch(`/students/${studentId}/fees`, { schema: studentFeesSchema, signal }),
  });
}

function onMoneyChange(qc: ReturnType<typeof useQueryClient>, studentId: string) {
  invalidate(qc, studentKeys.fees(studentId), reportKeys.all, dashboardKeys.all);
}

export function useCreateFee(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createFeeSchema>) =>
      apiFetch('/fees', { method: 'POST', body, schema: feeItemSchema }),
    onSuccess: () => {
      onMoneyChange(qc, studentId);
      toastSuccess('fees.created');
    },
  });
}

export function useUpdateFee(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateFeeSchema> }) =>
      apiFetch(`/fees/${id}`, { method: 'PATCH', body, schema: feeItemSchema }),
    onSuccess: () => {
      onMoneyChange(qc, studentId);
      toastSuccess('fees.updated');
    },
  });
}

export function useCreatePayment(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createPaymentSchema>) =>
      apiFetch('/payments', { method: 'POST', body, schema: paymentSchema }),
    onSuccess: () => {
      onMoneyChange(qc, studentId);
      toastSuccess('payments.recorded');
    },
  });
}

export function useVoidPayment(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof voidPaymentSchema> }) =>
      apiFetch(`/payments/${id}/void`, { method: 'POST', body, schema: paymentSchema }),
    onSuccess: () => {
      onMoneyChange(qc, studentId);
      toastSuccess('payments.voided');
    },
  });
}
