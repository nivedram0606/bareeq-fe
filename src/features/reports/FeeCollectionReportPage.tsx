import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { PAY_METHODS } from '@bareeq/shared';
import type { FeeCollectionRow } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';
import { NativeSelect } from '@/components/ui/form-controls';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useUiStore } from '@/stores/ui.store';

import { useFeeCollectionReport } from './api';
import { ClassFilter, DateFilter, ReportShell } from './ReportShell';

const PAGE_SIZE = 50;
const FILTERS = ['from', 'to', 'classId', 'method'] as const;

export function FeeCollectionReportPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const query = { ...values, page, pageSize: PAGE_SIZE };
  const report = useFeeCollectionReport(query);

  const columns = useMemo<ColumnDef<FeeCollectionRow, unknown>[]>(
    () => [
      {
        accessorKey: 'paidOn',
        header: t('reports.date'),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{formatDate(row.original.paidOn, locale)}</span>
        ),
      },
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
        accessorKey: 'amount',
        header: t('payments.amount'),
        meta: { className: 'text-end' },
        cell: ({ row }) => <MoneyText value={row.original.amount} />,
      },
      {
        accessorKey: 'method',
        header: t('payments.method'),
        cell: ({ row }) => t(`payMethods.${row.original.method}`),
      },
      {
        accessorKey: 'reference',
        header: t('payments.reference'),
        cell: ({ row }) => <span className="ltr-nums">{row.original.reference ?? '—'}</span>,
      },
      { accessorKey: 'receivedBy', header: t('payments.receivedBy') },
    ],
    [t, locale],
  );

  return (
    <ReportShell
      name="fee-collection"
      title={t('reports.collectionTitle')}
      description={t('reports.collectionSubtitle')}
      query={query}
      filters={
        <>
          <DateFilter
            label={t('reports.from')}
            value={values.from}
            onChange={(from) => setFilters({ from })}
          />
          <DateFilter
            label={t('reports.to')}
            value={values.to}
            onChange={(to) => setFilters({ to })}
          />
          <ClassFilter value={values.classId} onChange={(classId) => setFilters({ classId })} />
          <NativeSelect
            aria-label={t('payments.method')}
            className="w-full sm:w-44"
            value={values.method}
            onChange={(e) => setFilters({ method: e.target.value })}
          >
            <option value="">{t('reports.allMethods')}</option>
            {PAY_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`payMethods.${m}`)}
              </option>
            ))}
          </NativeSelect>
          <ClearFiltersButton active={isFiltered} onClear={clearFilters} />
        </>
      }
    >
      <DataTable
        caption={t('reports.collectionTitle')}
        columns={columns}
        data={report.data?.data}
        isPending={report.isPending}
        isError={report.isError}
        error={report.error}
        onRetry={() => void report.refetch()}
        emptyMessage={t('reports.empty')}
        getRowId={(r) => r.paymentId}
        footer={
          report.data ? (
            <TableRow>
              <TableCell colSpan={4}>{t('reports.totalCollected')}</TableCell>
              <TableCell className="text-end" data-testid="report-total">
                <MoneyText value={report.data.totals.collected} />
              </TableCell>
              <TableCell colSpan={3} />
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
