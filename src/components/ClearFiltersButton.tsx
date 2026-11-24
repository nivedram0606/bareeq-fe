import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useTestId } from '@/lib/testId';

/** "Clear filters" action for a list's filter row; rendered only while a filter is active. */
export function ClearFiltersButton({ active, onClear }: { active: boolean; onClear: () => void }) {
  const { t } = useTranslation();
  const tid = useTestId();
  if (!active) return null;
  return (
    <Button variant="ghost" onClick={onClear} data-testid={tid('clear-filters')}>
      <X aria-hidden="true" />
      {t('common.clearFilters')}
    </Button>
  );
}
