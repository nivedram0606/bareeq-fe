import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { voidPaymentSchema } from '@bareeq/shared';
import type { PaymentDto } from '@bareeq/shared';

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
import { Textarea } from '@/components/ui/form-controls';
import { applyServerErrors, useResetOnOpen } from '@/lib/forms';

import { useVoidPayment } from './api';

type Values = z.input<typeof voidPaymentSchema>;

/** Admin-only: voids a payment with a mandatory reason (payments are never edited or deleted). */
export function VoidPaymentDialog({
  studentId,
  payment,
  onClose,
}: {
  studentId: string;
  payment: PaymentDto | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const voidPayment = useVoidPayment(studentId);
  const form = useForm<Values, unknown, z.output<typeof voidPaymentSchema>>({
    resolver: zodResolver(voidPaymentSchema),
    values: { reason: '' },
  });
  const { errors, isSubmitting } = form.formState;
  useResetOnOpen(Boolean(payment), form.reset);

  const onSubmit = form.handleSubmit(async (body) => {
    if (!payment) return;
    try {
      await voidPayment.mutateAsync({ id: payment.id, body });
      onClose();
    } catch (err) {
      applyServerErrors(err, form.setError, ['reason']);
    }
  });

  return (
    <Dialog open={Boolean(payment)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent closeLabel={t('common.close')} testId="void-payment-form">
        <DialogHeader>
          <DialogTitle>{t('payments.voidTitle')}</DialogTitle>
          <DialogDescription>
            {t('payments.voidBody')} {payment ? <MoneyText value={payment.amount} /> : null}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('payments.voidReason')} error={errors.reason?.message} required>
            <Textarea {...form.register('reason')} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} data-testid="void-payment-form-cancel">
              {t('common.cancel')}
            </Button>
            <Button
              data-testid="void-payment-form-submit"
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
            >
              {t('payments.void')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
