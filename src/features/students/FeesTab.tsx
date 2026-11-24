import { Ban, Banknote, Pencil, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ADMIN_ONLY, STAFF_OR_ADMIN } from '@bareeq/shared';
import type { FeeItemDto, FeeItemWithPaymentsDto, PaymentDto } from '@bareeq/shared';

import { MoneyText } from '@/components/MoneyText';
import { RoleGate } from '@/components/RoleGate';
import { EmptyState, ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHasRole } from '@/components/useHasRole';
import { useStudentFees } from '@/features/fees/api';
import { BalanceBadge } from '@/features/fees/BalanceBadge';
import { FeeItemForm } from '@/features/fees/FeeItemForm';
import { PaymentForm } from '@/features/fees/PaymentForm';
import { VoidPaymentDialog } from '@/features/fees/VoidPaymentDialog';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { TestIdScope } from '@/lib/testId';
import { useUiStore } from '@/stores/ui.store';

function Amount({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium" data-testid={testId}>
        {children}
      </dd>
    </div>
  );
}

function PaymentHistory({
  payments,
  onVoid,
  testId,
}: {
  payments: PaymentDto[];
  onVoid: (p: PaymentDto) => void;
  /** The fee card's test ID; rows are `<testId>-payment-<id>`. */
  testId: string;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const isAdmin = useHasRole(ADMIN_ONLY);
  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" data-testid={`${testId}-payments-empty`}>
        {t('payments.none')}
      </p>
    );
  }
  return (
    <Table data-testid={`${testId}-payments`}>
      <caption className="sr-only">{t('payments.history')}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t('payments.paidOn')}</TableHead>
          <TableHead>{t('payments.amount')}</TableHead>
          <TableHead>{t('payments.method')}</TableHead>
          <TableHead>{t('payments.reference')}</TableHead>
          <TableHead>{t('payments.receivedBy')}</TableHead>
          {isAdmin ? (
            <TableHead>
              <span className="sr-only">{t('common.actions')}</span>
            </TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => {
          const voided = Boolean(p.voidedAt);
          return (
            <TableRow
              key={p.id}
              data-testid={`${testId}-payment-${p.id}`}
              className={cn(voided && 'text-muted-foreground')}
            >
              <TableCell className="whitespace-nowrap">{formatDate(p.paidOn, locale)}</TableCell>
              <TableCell>
                <MoneyText value={p.amount} strike={voided} />
                {voided ? (
                  <p className="text-xs" data-testid={`${testId}-payment-${p.id}-voided`}>
                    {t('payments.voidedBy', { name: p.voidedByName ?? '' })}: {p.voidReason}
                  </p>
                ) : null}
              </TableCell>
              <TableCell>{t(`payMethods.${p.method}`)}</TableCell>
              <TableCell className="ltr-nums">{p.reference ?? '—'}</TableCell>
              <TableCell>{p.receivedByName}</TableCell>
              {isAdmin ? (
                <TableCell className="text-end">
                  {!voided ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVoid(p)}
                      data-testid={`${testId}-payment-${p.id}-void`}
                    >
                      <Ban aria-hidden="true" />
                      {t('payments.void')}
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function FeeCard({
  fee,
  onPay,
  onEdit,
  onVoid,
}: {
  fee: FeeItemWithPaymentsDto;
  onPay: () => void;
  onEdit: () => void;
  onVoid: (p: PaymentDto) => void;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const id = `student-fees-fee-${fee.id}`;
  return (
    <Card data-testid={id}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle data-testid={`${id}-title`}>{fee.title}</CardTitle>
          <p className="text-sm text-muted-foreground" data-testid={`${id}-due-date`}>
            {t('fees.dueOn', { date: formatDate(fee.dueDate, locale) })}
          </p>
        </div>
        <BalanceBadge status={fee.status} outstanding={fee.outstanding} testId={`${id}-status`} />
      </CardHeader>
      <CardContent className="grid gap-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Amount label={t('fees.amount')} testId={`${id}-amount`}>
            <MoneyText value={fee.amount} />
          </Amount>
          <Amount label={t('fees.discount')} testId={`${id}-discount`}>
            <MoneyText value={fee.discount} />
          </Amount>
          <Amount label={t('fees.netDue')} testId={`${id}-net-due`}>
            <MoneyText value={fee.netDue} />
          </Amount>
          <Amount label={t('fees.paid')} testId={`${id}-paid`}>
            <MoneyText value={fee.paid} />
          </Amount>
          <Amount label={t('fees.outstanding')} testId={`${id}-outstanding`}>
            <MoneyText value={fee.outstanding} />
          </Amount>
        </dl>
        <RoleGate roles={STAFF_OR_ADMIN}>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onPay} data-testid={`${id}-record-payment`}>
              <Banknote aria-hidden="true" />
              {t('payments.record')}
            </Button>
            {!fee.locked ? (
              <Button size="sm" variant="outline" onClick={onEdit} data-testid={`${id}-edit`}>
                <Pencil aria-hidden="true" />
                {t('fees.edit')}
              </Button>
            ) : null}
          </div>
        </RoleGate>
        <div className="grid gap-2">
          <h4 className="text-sm font-semibold">{t('payments.history')}</h4>
          <PaymentHistory payments={fee.payments} onVoid={onVoid} testId={id} />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeesTab({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const fees = useStudentFees(studentId);
  const [feeDialog, setFeeDialog] = useState<{ open: boolean; fee: FeeItemDto | null }>({
    open: false,
    fee: null,
  });
  const [payFor, setPayFor] = useState<FeeItemDto | null>(null);
  const [voiding, setVoiding] = useState<PaymentDto | null>(null);

  if (fees.isPending) return <Skeleton className="h-64 rounded-xl" />;
  if (fees.isError) {
    return (
      <TestIdScope id="student-fees">
        <ErrorState error={fees.error} onRetry={() => void fees.refetch()} />
      </TestIdScope>
    );
  }
  const { summary, items } = fees.data;

  return (
    <TestIdScope id="student-fees">
      <div className="grid gap-4">
        <Card className="gap-3" data-testid="student-fees-summary">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <CardTitle>{t('fees.summary')}</CardTitle>
            <div className="flex items-center gap-3">
              <BalanceBadge
                status={summary.status}
                outstanding={summary.outstanding}
                testId="student-fees-summary-status"
              />
              <RoleGate roles={STAFF_OR_ADMIN}>
                <Button
                  size="sm"
                  onClick={() => setFeeDialog({ open: true, fee: null })}
                  data-testid="student-fees-add"
                >
                  <Plus aria-hidden="true" />
                  {t('fees.add')}
                </Button>
              </RoleGate>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <Amount label={t('fees.netDue')} testId="student-fees-summary-net-due">
                <MoneyText value={summary.netDue} />
              </Amount>
              <Amount label={t('fees.paid')} testId="student-fees-summary-paid">
                <MoneyText value={summary.paid} />
              </Amount>
              <Amount label={t('fees.outstanding')} testId="student-fees-summary-outstanding">
                <MoneyText value={summary.outstanding} />
              </Amount>
            </dl>
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <EmptyState message={t('fees.empty')} />
        ) : (
          items.map((fee) => (
            <FeeCard
              key={fee.id}
              fee={fee}
              onPay={() => setPayFor(fee)}
              onEdit={() => setFeeDialog({ open: true, fee })}
              onVoid={setVoiding}
            />
          ))
        )}

        <FeeItemForm
          studentId={studentId}
          fee={feeDialog.fee}
          open={feeDialog.open}
          onOpenChange={(open) => setFeeDialog((s) => ({ ...s, open }))}
        />
        <PaymentForm
          studentId={studentId}
          fee={payFor}
          open={Boolean(payFor)}
          onOpenChange={(open) => !open && setPayFor(null)}
        />
        <VoidPaymentDialog
          studentId={studentId}
          payment={voiding}
          onClose={() => setVoiding(null)}
        />
      </div>
    </TestIdScope>
  );
}
