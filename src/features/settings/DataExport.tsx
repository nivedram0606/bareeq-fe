import { FileArchive } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useDataExport } from './api';

const TABLES = [
  'organizations',
  'profiles',
  'academic_years',
  'classes',
  'students',
  'guardians',
  'staff',
  'fee_items',
  'payments',
  'audit_log',
] as const;

/** Admin: downloads a ZIP with one CSV per table (UTF-8 with BOM). */
export function DataExportPage() {
  const { t } = useTranslation();
  const exportZip = useDataExport();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('export.title')} description={t('export.subtitle')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('export.cardTitle')}</CardTitle>
          <CardDescription>{t('export.cardBody')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="flex flex-wrap gap-2">
            {TABLES.map((name) => (
              <li key={name} className="rounded-md bg-muted px-2 py-1 font-mono text-xs" dir="ltr">
                {name}.csv
              </li>
            ))}
          </ul>
          <div>
            <Button disabled={exportZip.isPending} onClick={() => exportZip.mutate()}>
              <FileArchive aria-hidden="true" />
              {exportZip.isPending ? t('export.preparing') : t('export.download')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
