import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import type { z } from 'zod';

import { createClassSchema } from '@bareeq/shared';
import type { ClassDto } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { DataTable } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/format';
import { applyServerErrors, useResetOnOpen } from '@/lib/forms';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useStaff } from '@/features/staff/api';
import { TestIdScope } from '@/lib/testId';
import { useUiStore } from '@/stores/ui.store';

import { useAcademicYears, useClasses, useCreateClass, useUpdateClass } from './api';

type Input_ = z.input<typeof createClassSchema>;
type Output = z.output<typeof createClassSchema>;
const FIELDS = ['name', 'grade', 'section', 'academicYearId', 'teacherId'] as const;
const PAGE_SIZE = 20;
const FILTERS = ['search', 'academicYearId'] as const;

function ClassDialog({
  cls,
  open,
  onOpenChange,
}: {
  cls: ClassDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const years = useAcademicYears();
  const create = useCreateClass();
  const update = useUpdateClass();
  const currentYearId = years.data?.data.find((y) => y.isCurrent)?.id ?? '';
  const teachers = useStaff({ status: 'active', pageSize: 100, sort: 'fullName' });
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createClassSchema),
    values: {
      name: cls?.name ?? '',
      grade: cls?.grade ?? '',
      section: cls?.section ?? '',
      academicYearId: cls?.academicYearId ?? currentYearId,
      teacherId: cls?.teacherId ?? '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  useResetOnOpen(open, form.reset);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (cls) await update.mutateAsync({ id: cls.id, body: values });
      else await create.mutateAsync(values);
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')} testId="class-form">
        <DialogHeader>
          <DialogTitle>{cls ? t('classes.edit') : t('classes.new')}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('classes.name')} error={errors.name?.message} required>
            <Input autoComplete="off" {...form.register('name')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('classes.grade')} error={errors.grade?.message} required>
              <Input autoComplete="off" {...form.register('grade')} />
            </FormField>
            <FormField label={t('classes.section')} error={errors.section?.message}>
              <Input autoComplete="off" {...form.register('section')} />
            </FormField>
          </div>
          <FormField
            label={t('classes.academicYear')}
            error={errors.academicYearId?.message}
            required
          >
            <NativeSelect {...form.register('academicYearId')}>
              <option value="">{t('common.select')}</option>
              {years.data?.data.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField
            label={t('classes.teacher')}
            error={errors.teacherId?.message}
            hint={t('classes.teacherHint')}
          >
            <NativeSelect {...form.register('teacherId')}>
              <option value="">{t('classes.noTeacher')}</option>
              {/* Keep a current teacher who has since become inactive selectable. */}
              {cls?.teacherId && !teachers.data?.data.some((m) => m.id === cls.teacherId) ? (
                <option value={cls.teacherId}>{cls.teacherName}</option>
              ) : null}
              {teachers.data?.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} · {t(`designations.${m.designation}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="class-form-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button data-testid="class-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClassesPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const years = useAcademicYears();
  const query = useClasses({ ...values, page, pageSize: PAGE_SIZE });
  const [dialog, setDialog] = useState<{ open: boolean; cls: ClassDto | null }>({
    open: false,
    cls: null,
  });

  const columns = useMemo<ColumnDef<ClassDto, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('classes.name'),
        cell: ({ row }) => (
          <Link
            to={`/students?classId=${row.original.id}`}
            data-testid={`classes-row-${row.original.id}-students`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: 'grade', header: t('classes.grade') },
      {
        accessorKey: 'section',
        header: t('classes.section'),
        cell: ({ row }) => row.original.section ?? '—',
      },
      { accessorKey: 'academicYearName', header: t('classes.academicYear') },
      {
        accessorKey: 'teacherName',
        header: t('classes.teacher'),
        cell: ({ row }) => row.original.teacherName ?? '—',
      },
      {
        accessorKey: 'studentCount',
        header: t('classes.students'),
        cell: ({ row }) => formatNumber(row.original.studentCount, locale),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        meta: { className: 'text-end' },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialog({ open: true, cls: row.original })}
            data-testid={`classes-row-${row.original.id}-edit`}
          >
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </Button>
        ),
      },
    ],
    [t, locale],
  );

  return (
    <TestIdScope id="classes">
      <PageHeader
        title={t('classes.title')}
        actions={
          <Button onClick={() => setDialog({ open: true, cls: null })} data-testid="classes-new">
            <Plus aria-hidden="true" />
            {t('classes.new')}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          label={t('classes.search')}
          value={values.search}
          onChange={(search) => setFilters({ search })}
        />
        <NativeSelect
          aria-label={t('classes.academicYear')}
          data-testid="classes-filter-academic-year"
          className="w-full sm:w-52"
          value={values.academicYearId}
          onChange={(e) => setFilters({ academicYearId: e.target.value })}
        >
          <option value="">{t('classes.allYears')}</option>
          {years.data?.data.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </NativeSelect>
        <ClearFiltersButton active={isFiltered} onClear={clearFilters} />
      </div>
      <DataTable
        caption={t('classes.title')}
        columns={columns}
        data={query.data?.data}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage={t('classes.empty')}
        getRowId={(c) => c.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: query.data?.total ?? 0,
          onPageChange: (p) => setFilters({ page: p }),
        }}
      />
      <ClassDialog
        cls={dialog.cls}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </TestIdScope>
  );
}
