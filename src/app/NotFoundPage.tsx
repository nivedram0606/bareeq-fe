import { FileQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <FileQuestion className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold" data-testid="not-found-heading">
        {t('common.notFoundTitle')}
      </h1>
      <p className="text-sm text-muted-foreground" data-testid="not-found-body">
        {t('common.notFoundBody')}
      </p>
      <Button asChild variant="outline">
        <Link to="/" data-testid="not-found-go-home">
          {t('common.goHome')}
        </Link>
      </Button>
    </div>
  );
}
