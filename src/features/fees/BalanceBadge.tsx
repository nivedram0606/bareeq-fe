import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { isOverpaid } from '@bareeq/shared';
import type { BalanceStatus } from '@bareeq/shared';

import { Badge } from '@/components/ui/form-controls';

const VARIANT = { paid: 'success', partial: 'warning', unpaid: 'destructive' } as const;

/** Paid / partial / unpaid status, plus a warning badge when the balance is overpaid. */
export function BalanceBadge({
  status,
  outstanding,
  testId,
}: {
  status: BalanceStatus;
  outstanding: string;
  /** Test ID of the status badge; the overpaid badge is `<testId>-overpaid`. */
  testId: string;
}) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant={VARIANT[status]} data-testid={testId}>
        {t(`balance.${status}`)}
      </Badge>
      {isOverpaid(outstanding) ? (
        <Badge variant="warning" data-testid={`${testId}-overpaid`}>
          <AlertTriangle aria-hidden="true" />
          {t('balance.overpaid')}
        </Badge>
      ) : null}
    </span>
  );
}
