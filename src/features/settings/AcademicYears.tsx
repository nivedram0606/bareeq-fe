import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createAcademicYearSchema } from '@bareeq/shared';
import type { AcademicYearDto } from '@bareeq/shared';

import { DataTable } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge, Checkbox } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { useAcademicYears } from '@/features/classes/api';
import { formatDate } from '@/lib/format';
import { applyServerErrors } from '@/lib/forms';
import { useUiStore } from '@/stores/ui.store';

import { useCreateAcademicYear, useUpdateAcademicYear } from './api';

type Input_ = z.input<typeof createAcademicYearSchema>;
type Output = z.output<typeof createAcademicYearSchema>;
const FIELDS = ['name', 'startDate', 'endDate', 'isCurrent'] as const;

/** `YYYY-MM-DD` shifted by `days` (UTC, so no time-zone drift); '' stays ''. */
function shiftDate(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function YearDialog({
  year,
  open,
  onOpenChange,
}: {
  year: AcademicYearDto | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateAcademicYear();
  const update = useUpdateAcademicYear();
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createAcademicYearSchema),
    values: {
      name: year?.name ?? '',
      startDate: year?.startDate ?? '',
      endDate: year?.endDate ?? '',
      isCurrent: year?.isCurrent ?? false,
    },
  });
  const { errors, isSubmitting } = form.formState;
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  // The end must be after the start: the pickers only offer valid days, and a pair that is
  // still wrong (typed by hand, or the other date changed) is flagged right away, not on Save.
  const dateField = (name: 'startDate' | 'endDate') =>
    form.register(name, {
      onChange: () => {
        if (form.getValues('startDate') && form.getValues('endDate')) void form.trigger('endDate');
      },
    });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (year) await update.mutateAsync({ id: year.id, body: values });
      else await create.mutateAsync(values);
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{year ? t('years.edit') : t('years.new')}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('years.name')} error={errors.name?.message} hint="2026-2027" required>
            <Input dir="ltr" autoComplete="off" {...form.register('name')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('years.startDate')} error={errors.startDate?.message} required>
              <Input
                type="date"
                max={shiftDate(endDate, -1) || undefined}
                {...dateField('startDate')}
              />
            </FormField>
            <FormField label={t('years.endDate')} error={errors.endDate?.message} required>
              <Input
                type="date"
                min={shiftDate(startDate, 1) || undefined}
                {...dateField('endDate')}
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox {...form.register('isCurrent')} />
            {t('years.isCurrent')}
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AcademicYearsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const years = useAcademicYears();
  const update = useUpdateAcademicYear();
  const [dialog, setDialog] = useState<{ open: boolean; year: AcademicYearDto | null }>({
    open: false,
    year: null,
  });

  const columns = useMemo<ColumnDef<AcademicYearDto, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('years.name'),
        cell: ({ row }) => <span className="ltr-nums font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'startDate',
        header: t('years.startDate'),
        cell: ({ row }) => formatDate(row.original.startDate, locale),
      },
      {
        accessorKey: 'endDate',
        header: t('years.endDate'),
        cell: ({ row }) => formatDate(row.original.endDate, locale),
      },
      {
        accessorKey: 'isCurrent',
        header: t('years.current'),
        cell: ({ row }) =>
          row.original.isCurrent ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden="true" />
              {t('years.current')}
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: row.original.id, body: { isCurrent: true } })}
            >
              {t('years.setCurrent')}
            </Button>
          ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        meta: { className: 'text-end' },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialog({ open: true, year: row.original })}
          >
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </Button>
        ),
      },
    ],
    [t, locale, update],
  );

  return (
    <>
      <PageHeader
        title={t('years.title')}
        description={t('years.subtitle')}
        actions={
          <Button onClick={() => setDialog({ open: true, year: null })}>
            <Plus aria-hidden="true" />
            {t('years.new')}
          </Button>
        }
      />
      <DataTable
        caption={t('years.title')}
        columns={columns}
        data={years.data?.data}
        isPending={years.isPending}
        isError={years.isError}
        error={years.error}
        onRetry={() => void years.refetch()}
        emptyMessage={t('years.empty')}
        getRowId={(y) => y.id}
      />
      <YearDialog
        year={dialog.year}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </>
  );
}
