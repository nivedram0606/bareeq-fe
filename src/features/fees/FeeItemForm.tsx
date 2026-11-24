import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createFeeSchema } from '@bareeq/shared';
import type { FeeItemDto } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { useAcademicYears } from '@/features/classes/api';
import { applyServerErrors, useResetOnOpen } from '@/lib/forms';

import { useCreateFee, useUpdateFee } from './api';

type Input_ = z.input<typeof createFeeSchema>;
type Output = z.output<typeof createFeeSchema>;
const FIELDS = ['title', 'academicYearId', 'amount', 'discount', 'dueDate'] as const;

/** Add a fee to a student, or edit one that has no (non-voided) payments yet. */
export function FeeItemForm({
  studentId,
  fee,
  open,
  onOpenChange,
}: {
  studentId: string;
  fee: FeeItemDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const years = useAcademicYears();
  const create = useCreateFee(studentId);
  const update = useUpdateFee(studentId);
  const currentYearId = years.data?.data.find((y) => y.isCurrent)?.id ?? '';

  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createFeeSchema),
    values: {
      studentId,
      title: fee?.title ?? '',
      academicYearId: fee ? (fee.academicYearId ?? '') : currentYearId,
      amount: fee?.amount ?? '',
      discount: fee?.discount ?? '0.000',
      dueDate: fee?.dueDate ?? '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  useResetOnOpen(open, form.reset);

  const onSubmit = form.handleSubmit(async ({ studentId: _s, ...values }) => {
    try {
      if (fee) await update.mutateAsync({ id: fee.id, body: values });
      else await create.mutateAsync({ studentId, ...values });
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')} testId="fee-form">
        <DialogHeader>
          <DialogTitle>{fee ? t('fees.edit') : t('fees.add')}</DialogTitle>
          <DialogDescription>{t('fees.formHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('fees.feeTitle')} error={errors.title?.message} required>
            <Input autoComplete="off" {...form.register('title')} />
          </FormField>
          <FormField label={t('fees.academicYear')} error={errors.academicYearId?.message}>
            <NativeSelect {...form.register('academicYearId')}>
              <option value="">{t('fees.noYear')}</option>
              {years.data?.data.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('fees.amount')} error={errors.amount?.message} required>
              <Input
                inputMode="decimal"
                dir="ltr"
                placeholder="0.000"
                autoComplete="off"
                {...form.register('amount')}
              />
            </FormField>
            <FormField label={t('fees.discount')} error={errors.discount?.message}>
              <Input
                inputMode="decimal"
                dir="ltr"
                placeholder="0.000"
                autoComplete="off"
                {...form.register('discount')}
              />
            </FormField>
          </div>
          <FormField label={t('fees.dueDate')} error={errors.dueDate?.message} required>
            <Input type="date" {...form.register('dueDate')} />
          </FormField>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="fee-form-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button data-testid="fee-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
