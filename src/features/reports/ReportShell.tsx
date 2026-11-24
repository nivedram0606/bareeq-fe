import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { ReportName } from '@bareeq/shared';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/form-controls';
import { useClassOptions } from '@/features/classes/api';
import type { QueryParams } from '@/lib/api';
import { TestIdScope, useTestId } from '@/lib/testId';

import { useExportCsv } from './api';

/** Page header with the "Export CSV" action (same filters as the on-screen report). */
export function ReportShell({
  name,
  title,
  description,
  query,
  filters,
  children,
}: {
  name: ReportName;
  title: string;
  description: string;
  query: QueryParams;
  filters: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const exportCsv = useExportCsv(name);
  const scope = `report-${name}`;
  return (
    <TestIdScope id={scope}>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button
            variant="outline"
            disabled={exportCsv.isPending}
            data-testid={`${scope}-export`}
            onClick={() => exportCsv.mutate(query)}
          >
            <Download aria-hidden="true" />
            {exportCsv.isPending ? t('reports.exporting') : t('reports.exportCsv')}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-end gap-3" data-testid={`${scope}-filters`}>
        {filters}
      </div>
      {children}
    </TestIdScope>
  );
}

export function ClassFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const classes = useClassOptions();
  const tid = useTestId();
  return (
    <NativeSelect
      aria-label={t('students.filterClass')}
      data-testid={tid('filter-class')}
      className="w-full sm:w-52"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t('students.allClasses')}</option>
      {classes.data?.data.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} · {c.academicYearName}
        </option>
      ))}
    </NativeSelect>
  );
}

export function DateFilter({
  label,
  field,
  value,
  onChange,
}: {
  label: string;
  /** Filter key, used in the test ID `<scope>-filter-<field>`. */
  field: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const tid = useTestId();
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="date"
        data-testid={tid('filter', field)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </label>
  );
}
