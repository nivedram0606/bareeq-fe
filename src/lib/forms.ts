import { useEffect } from 'react';
import type { FieldValues, Path, UseFormReset, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';

import i18n from '@/i18n';

import { isApiError } from './api';

/** i18n key describing an error for a toast. */
export function errorKey(error: unknown): string {
  if (!isApiError(error)) return 'errors.generic';
  if (error.code === 'NETWORK') return 'common.networkError';
  if (error.status === 429) return 'errors.rateLimited';
  const firstDetail = error.details ? Object.values(error.details)[0] : undefined;
  if (firstDetail?.startsWith('validation.')) return firstDetail;
  return `errors.${error.code}`;
}

export function toastError(error: unknown): void {
  toast.error(i18n.t(errorKey(error), { defaultValue: i18n.t('errors.generic') }));
}

/**
 * Maps an API `VALIDATION_ERROR` / `CONFLICT` with field details onto react-hook-form fields.
 * Falls back to a toast for errors that do not belong to a known field.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  if (isApiError(error) && error.details) {
    let mapped = false;
    for (const [field, message] of Object.entries(error.details)) {
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: 'server', message });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toastError(error);
}

export function toastSuccess(key: string): void {
  toast.success(i18n.t(key));
}

/**
 * Clears a dialog's form each time the dialog opens, so a cancelled or closed dialog never shows
 * the values or errors from last time. The form goes back to its `values` / `defaultValues`.
 */
export function useResetOnOpen<T extends FieldValues>(open: boolean, reset: UseFormReset<T>): void {
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);
}
