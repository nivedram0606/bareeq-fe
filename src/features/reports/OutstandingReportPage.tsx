import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { OutstandingRow } from '@bareeq/shared';

import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';
import { SearchInput } from '@/components/SearchInput';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useUiStore } from '@/stores/ui.store';

import { useOutstandingReport } from './api';
import { ClassFilter, DateFilter, ReportShell } from './ReportShell';

const PAGE_SIZE = 50;
const FILTERS = ['search', 'classId', 'dueBefore'] as const;

export function OutstandingReportPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { values, page, setFilters } = useUrlFilters(FILTERS);
  const query = { ...values, page, pageSize: PAGE_SIZE };
  const report = useOutstandingReport(query);

  const columns = useMemo<ColumnDef<OutstandingRow, unknown>[]>(
    () => [
      {
        accessorKey: 'studentName',
        header: t('reports.student'),
        cell: ({ row }) => (
          <Link
            to={`/students/${row.original.studentId}?tab=fees`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.studentName}
          </Link>
        ),
      },
      {
        accessorKey: 'className',
        header: t('students.class'),
        cell: ({ row }) => row.original.className ?? '—',
      },
      { accessorKey: 'feeTitle', header: t('reports.fee') },
      {
        accessorKey: 'netDue',
        header: t('fees.netDue'),
        meta: { className: 'text-end' },
        cell: ({ row }) => <MoneyText value={row.original.netDue} />,
      },
      {
        accessorKey: 'paid',
        header: t('fees.paid'),
        meta: { className: 'text-end' },
        cell: ({ row }) => <MoneyText value={row.original.paid} />,
      },
      {
        accessorKey: 'outstanding',
        header: t('fees.outstanding'),
        meta: { className: 'text-end' },
        cell: ({ row }) => <MoneyText value={row.original.outstanding} className="font-medium" />,
      },
      {
        accessorKey: 'dueDate',
        header: t('fees.dueDate'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatDate(row.original.dueDate, locale)}</span>
        ),
      },
    ],
    [t, locale],
  );

  return (
    <ReportShell
      name="outstanding"
      title={t('reports.outstandingTitle')}
      description={t('reports.outstandingSubtitle')}
      query={query}
      filters={
        <>
          <SearchInput
            label={t('students.search')}
            value={values.search}
            onChange={(search) => setFilters({ search })}
          />
          <ClassFilter value={values.classId} onChange={(classId) => setFilters({ classId })} />
          <DateFilter
            label={t('reports.dueBefore')}
            value={values.dueBefore}
            onChange={(dueBefore) => setFilters({ dueBefore })}
          />
        </>
      }
    >
      <DataTable
        caption={t('reports.outstandingTitle')}
        columns={columns}
        data={report.data?.data}
        isPending={report.isPending}
        isError={report.isError}
        error={report.error}
        onRetry={() => void report.refetch()}
        emptyMessage={t('reports.noOutstanding')}
        getRowId={(r) => r.feeItemId}
        footer={
          report.data ? (
            <TableRow>
              <TableCell colSpan={5}>{t('reports.totalOutstanding')}</TableCell>
              <TableCell className="text-end" data-testid="report-total">
                <MoneyText value={report.data.totals.outstanding} />
              </TableCell>
              <TableCell />
            </TableRow>
          ) : null
        }
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
