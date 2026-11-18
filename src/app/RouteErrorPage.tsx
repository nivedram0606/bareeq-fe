import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button } from '@/components/ui/button';

import { NotFoundPage } from './NotFoundPage';

/**
 * Shown when a route fails to render or its code chunk fails to load (e.g. after a new
 * deployment). Reloading fetches the current build.
 */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <AlertTriangle className="size-10 text-warning" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t('common.crashTitle')}</h1>
      <p className="text-sm text-muted-foreground">{t('common.crashBody')}</p>
      <Button onClick={() => window.location.reload()}>{t('common.reload')}</Button>
    </div>
  );
}
