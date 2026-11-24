import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { STAFF_OR_ADMIN, STUDENT_STATUS } from '@bareeq/shared';
import type { StudentDto } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { DataTable } from '@/components/DataTable';
import { PageHeader } from '@/components/PageHeader';
import { RoleGate } from '@/components/RoleGate';
import { SearchInput } from '@/components/SearchInput';
import { StatusBadge } from '@/components/StatusBadge';
import { useHasRole } from '@/components/useHasRole';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/form-controls';
import { useClassOptions } from '@/features/classes/api';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { TestIdScope } from '@/lib/testId';
import { useUiStore } from '@/stores/ui.store';

import { useStudents } from './api';

const PAGE_SIZE = 20;
const FILTERS = ['search', 'classId', 'status'] as const;

export function StudentsListPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const classes = useClassOptions();
  const query = useStudents({ ...values, page, pageSize: PAGE_SIZE });
  const canEdit = useHasRole(STAFF_OR_ADMIN);

  const columns = useMemo<ColumnDef<StudentDto, unknown>[]>(
    () => [
      { accessorKey: 'admissionNo', header: t('students.admissionNo') },
      {
        id: 'name',
        header: t('students.name'),
        cell: ({ row }) => {
          const s = row.original;
          const primary = locale === 'ar' && s.nameAr ? s.nameAr : `${s.firstName} ${s.lastName}`;
          const secondary = locale === 'ar' ? `${s.firstName} ${s.lastName}` : s.nameAr;
          return (
            <div className="grid">
              <Link
                to={`/students/${s.id}`}
                className="font-medium text-primary hover:underline"
                data-testid={`students-row-${s.id}-open`}
              >
                {primary}
              </Link>
              {secondary && secondary !== primary ? (
                <span className="text-xs text-muted-foreground">{secondary}</span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: 'className',
        header: t('students.class'),
        cell: ({ row }) => row.original.className ?? '—',
      },
      {
        accessorKey: 'status',
        header: t('students.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'primaryGuardianName',
        header: t('students.primaryGuardian'),
        cell: ({ row }) => row.original.primaryGuardianName ?? '—',
      },
      {
        accessorKey: 'primaryGuardianPhone',
        header: t('students.phone'),
        cell: ({ row }) =>
          row.original.primaryGuardianPhone ? (
            <span className="ltr-nums">{row.original.primaryGuardianPhone}</span>
          ) : (
            '—'
          ),
      },
      ...(canEdit
        ? [
            {
              id: 'actions',
              header: () => <span className="sr-only">{t('common.actions')}</span>,
              meta: { className: 'text-end' },
              cell: ({ row }) => (
                <Button asChild variant="ghost" size="sm">
                  <Link
                    to={`/students/${row.original.id}/edit`}
                    data-testid={`students-row-${row.original.id}-edit`}
                    aria-label={t('students.editNamed', {
                      name: `${row.original.firstName} ${row.original.lastName}`,
                    })}
                  >
                    <Pencil aria-hidden="true" />
                    <span className="max-lg:sr-only">{t('common.edit')}</span>
                  </Link>
                </Button>
              ),
            } satisfies ColumnDef<StudentDto, unknown>,
          ]
        : []),
    ],
    [t, locale, canEdit],
  );

  return (
    <TestIdScope id="students">
      <PageHeader
        title={t('students.title')}
        actions={
          <RoleGate roles={STAFF_OR_ADMIN}>
            <Button asChild>
              <Link to="/students/new" data-testid="students-new">
                <Plus aria-hidden="true" />
                {t('students.new')}
              </Link>
            </Button>
          </RoleGate>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          label={t('students.search')}
          value={values.search}
          onChange={(search) => setFilters({ search })}
        />
        <NativeSelect
          aria-label={t('students.filterClass')}
          data-testid="students-filter-class"
          className="w-full sm:w-52"
          value={values.classId}
          onChange={(e) => setFilters({ classId: e.target.value })}
        >
          <option value="">{t('students.allClasses')}</option>
          {classes.data?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.academicYearName}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t('students.filterStatus')}
          data-testid="students-filter-status"
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
        caption={t('students.title')}
        columns={columns}
        data={query.data?.data}
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyMessage={t('students.empty')}
        getRowId={(s) => s.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: query.data?.total ?? 0,
          onPageChange: (p) => setFilters({ page: p }),
        }}
      />
    </TestIdScope>
  );
}
