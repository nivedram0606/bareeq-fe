import type { ReactNode } from 'react';

import { useTestId } from '@/lib/testId';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  const tid = useTestId();
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid={tid('heading')}>
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground" data-testid={tid('description')}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
