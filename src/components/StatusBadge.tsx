import { useTranslation } from 'react-i18next';

import type { RecordStatus } from '@bareeq/shared';

import { Badge } from '@/components/ui/form-controls';

export function StatusBadge({ status }: { status: RecordStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={status === 'active' ? 'success' : 'secondary'}>{t(`status.${status}`)}</Badge>
  );
}
