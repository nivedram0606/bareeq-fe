import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { STUDENT_STATUS } from '@bareeq/shared';
import type { StudentReportRow } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { DataTable } from '@/components/DataTable';
import { SearchInput } from '@/components/SearchInput';
import { StatusBadge } from '@/components/StatusBadge';
import { NativeSelect } from '@/components/ui/form-controls';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useUiStore } from '@/stores/ui.store';

import { useStudentReport } from './api';
import { ClassFilter, ReportShell } from './ReportShell';

const PAGE_SIZE = 50;
const FILTERS = ['search', 'classId', 'status'] as const;

export function StudentListingReportPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const query = { ...values, page, pageSize: PAGE_SIZE };
  const report = useStudentReport(query);

  const columns = useMemo<ColumnDef<StudentReportRow, unknown>[]>(
    () => [
      {
        accessorKey: 'admissionNo',
        header: t('students.admissionNo'),
        cell: ({ row }) => <span className="ltr-nums">{row.original.admissionNo}</span>,
      },
      {
        accessorKey: 'studentName',
        header: t('students.name'),
        cell: ({ row }) => (
          <Link
            to={`/students/${row.original.studentId}`}
            className="font-medium text-primary hover:underline"
          >
            {locale === 'ar' && row.original.nameAr
              ? row.original.nameAr
              : row.original.studentName}
          </Link>
        ),
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
        accessorKey: 'primaryGuardian',
        header: t('students.primaryGuardian'),
        cell: ({ row }) => row.original.primaryGuardian ?? '—',
      },
      {
        accessorKey: 'phone',
        header: t('students.phone'),
        cell: ({ row }) =>
          row.original.phone ? <span className="ltr-nums">{row.original.phone}</span> : '—',
      },
    ],
    [t, locale],
  );

  return (
    <ReportShell
      name="students"
      title={t('reports.studentsTitle')}
      description={t('reports.studentsSubtitle')}
      query={query}
      filters={
        <>
          <SearchInput
            label={t('students.search')}
            value={values.search}
            onChange={(search) => setFilters({ search })}
          />
          <ClassFilter value={values.classId} onChange={(classId) => setFilters({ classId })} />
          <NativeSelect
            aria-label={t('students.filterStatus')}
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
        </>
      }
    >
      <DataTable
        caption={t('reports.studentsTitle')}
        columns={columns}
        data={report.data?.data}
        isPending={report.isPending}
        isError={report.isError}
        error={report.error}
        onRetry={() => void report.refetch()}
        emptyMessage={t('reports.empty')}
        getRowId={(r) => r.studentId}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: report.data?.total ?? 0,
          onPageChange: (p) => setFilters({ page: p }),
        }}
      />
    </ReportShell>
  );
}
