import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { ADMIN_ONLY, createStaffSchema, STUDENT_STATUS } from '@bareeq/shared';
import type { StaffDto } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { DataTable } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { RoleGate } from '@/components/RoleGate';
import { SearchInput } from '@/components/SearchInput';
import { StatusBadge } from '@/components/StatusBadge';
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
import { useHasRole } from '@/components/useHasRole';
import { applyServerErrors } from '@/lib/forms';
import { useUrlFilters } from '@/lib/useUrlFilters';

import { useCreateStaff, useStaff, useUpdateStaff } from './api';

type Input_ = z.input<typeof createStaffSchema>;
type Output = z.output<typeof createStaffSchema>;
const FIELDS = ['fullName', 'designation', 'phone', 'email', 'status'] as const;
const PAGE_SIZE = 20;
const FILTERS = ['search', 'status'] as const;

function StaffDialog({
  member,
  open,
  onOpenChange,
}: {
  member: StaffDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createStaffSchema),
    values: {
      fullName: member?.fullName ?? '',
      designation: member?.designation ?? '',
      phone: member?.phone ?? '',
      email: member?.email ?? '',
      status: member?.status ?? 'active',
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (member) await update.mutateAsync({ id: member.id, body: values });
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
          <DialogTitle>{member ? t('staff.edit') : t('staff.new')}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('staff.fullName')} error={errors.fullName?.message} required>
            <Input autoComplete="off" {...form.register('fullName')} />
          </FormField>
          <FormField label={t('staff.designation')} error={errors.designation?.message} required>
            <Input autoComplete="off" {...form.register('designation')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('staff.phone')} error={errors.phone?.message}>
              <Input type="tel" dir="ltr" autoComplete="off" {...form.register('phone')} />
            </FormField>
            <FormField label={t('staff.email')} error={errors.email?.message}>
              <Input type="email" dir="ltr" autoComplete="off" {...form.register('email')} />
            </FormField>
          </div>
          <FormField label={t('staff.status')} error={errors.status?.message} required>
            <NativeSelect {...form.register('status')}>
              {STUDENT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
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

export function StaffPage() {
  const { t } = useTranslation();
  const isAdmin = useHasRole(ADMIN_ONLY);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const query = useStaff({ ...values, page, pageSize: PAGE_SIZE });
  const [dialog, setDialog] = useState<{ open: boolean; member: StaffDto | null }>({
    open: false,
    member: null,
  });

  const columns = useMemo<ColumnDef<StaffDto, unknown>[]>(() => {
    const cols: ColumnDef<StaffDto, unknown>[] = [
      {
        accessorKey: 'fullName',
        header: t('staff.fullName'),
        cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
      },
      { accessorKey: 'designation', header: t('staff.designation') },
      {
        accessorKey: 'phone',
        header: t('staff.phone'),
        cell: ({ row }) =>
          row.original.phone ? <span className="ltr-nums">{row.original.phone}</span> : '—',
      },
      {
        accessorKey: 'email',
        header: t('staff.email'),
        cell: ({ row }) =>
          row.original.email ? <span className="ltr-nums">{row.original.email}</span> : '—',
      },
      {
        accessorKey: 'status',
        header: t('staff.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ];
    if (isAdmin) {
      cols.push({
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        meta: { className: 'text-end' },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialog({ open: true, member: row.original })}
          >
            <Pencil aria-hidden="true" />
            {t('common.edit')}
          </Button>
        ),
      });
    }
    return cols;
  }, [t, isAdmin]);

  return (
    <>
      <PageHeader
        title={t('staff.title')}
        description={t('staff.subtitle')}
        actions={
          <RoleGate roles={ADMIN_ONLY}>
            <Button onClick={() => setDialog({ open: true, member: null })}>
              <Plus aria-hidden="true" />
              {t('staff.new')}
            </Button>
          </RoleGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          label={t('staff.search')}
          value={values.search}
          onChange={(search) => setFilters({ search })}
        />
        <NativeSelect
          aria-label={t('staff.status')}
          className="w-full sm:w-40"
          value={values.status}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          <option value="">{t('students.allStatuses')}</option>
          {STUDENT_STATUS.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </NativeSelect>
        <ClearFiltersButton active={isFiltered} onClear={clearFilters} />
      </div>
      <DataTable
        caption={t('staff.title')}
        columns={columns}
        data={query.data?.data}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage={t('staff.empty')}
        getRowId={(s) => s.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: query.data?.total ?? 0,
          onPageChange: (p) => setFilters({ page: p }),
        }}
      />
      <StaffDialog
        member={dialog.member}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </>
  );
}
