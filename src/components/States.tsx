import { AlertCircle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { isApiError } from '@/lib/api';
import { useTestId } from '@/lib/testId';

/** Error message for a failed query, with a retry button. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const tid = useTestId();
  const message =
    isApiError(error) && error.code === 'NETWORK'
      ? t('common.networkError')
      : t('common.loadError');
  return (
    <div
      role="alert"
      data-testid={tid('error')}
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive"
    >
      <AlertCircle className="size-6" aria-hidden="true" />
      <p>{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} data-testid={tid('retry')}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  const tid = useTestId();
  return (
    <div
      data-testid={tid('empty')}
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      <Inbox className="size-6" aria-hidden="true" />
      <p>{message}</p>
      {action}
    </div>
  );
}

export function FullPageSpinner() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={t('app.loading')} className="[&>span:first-child]:size-8" />
    </div>
  );
}
