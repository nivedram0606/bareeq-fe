import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createPaymentSchema, PAY_METHODS, toBaisa } from '@bareeq/shared';
import type { FeeItemDto } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { MoneyText } from '@/components/MoneyText';
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
import { todayIso } from '@/lib/format';
import { applyServerErrors } from '@/lib/forms';

import { useCreatePayment } from './api';

type Input_ = z.input<typeof createPaymentSchema>;
type Output = z.output<typeof createPaymentSchema>;
const FIELDS = ['amount', 'paidOn', 'method', 'reference'] as const;

/** Records a manual payment (partial payments allowed) against one fee item. */
export function PaymentForm({
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
  const create = useCreatePayment(studentId);
  const suggested = fee && toBaisa(fee.outstanding) > 0n ? fee.outstanding : '';

  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createPaymentSchema),
    values: {
      feeItemId: fee?.id ?? '',
      amount: suggested,
      paidOn: todayIso(),
      method: 'cash',
      reference: '',
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('payments.record')}</DialogTitle>
          {fee ? (
            <DialogDescription>
              {fee.title} · {t('fees.outstanding')}: <MoneyText value={fee.outstanding} />
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('payments.amount')} error={errors.amount?.message} required>
              <Input
                inputMode="decimal"
                dir="ltr"
                placeholder="0.000"
                autoComplete="off"
                {...form.register('amount')}
              />
            </FormField>
            <FormField label={t('payments.paidOn')} error={errors.paidOn?.message} required>
              <Input type="date" {...form.register('paidOn')} />
            </FormField>
          </div>
          <FormField label={t('payments.method')} error={errors.method?.message} required>
            <NativeSelect {...form.register('method')}>
              {PAY_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`payMethods.${m}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label={t('payments.reference')} error={errors.reference?.message}>
            <Input autoComplete="off" dir="ltr" {...form.register('reference')} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('payments.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
