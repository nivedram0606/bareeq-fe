import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef, RowData } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useUiStore } from '@/stores/ui.store';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

declare module '@tanstack/react-table' {
  // Module augmentation: the generic parameters must match TanStack's declaration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Classes applied to the header and body cells of the column (e.g. `text-end`). */
    className?: string;
  }
}

/** Server-paginated table with loading (skeleton), error and empty states. */
export function DataTable<T>({
  columns,
  data,
  isPending,
  isError,
  error,
  onRetry,
  emptyMessage,
  emptyAction,
  pagination,
  footer,
  getRowId,
  rowClassName,
  caption,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[] | undefined;
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyMessage: string;
  emptyAction?: ReactNode;
  pagination?: PaginationState;
  footer?: ReactNode;
  getRowId?: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  caption?: string;
}) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  // TanStack Table v8 is not React-Compiler-memoizable; the compiler skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId,
  });

  if (isError) return <ErrorState error={error} onRetry={onRetry} />;

  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-card">
        <Table aria-busy={isPending}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((_c, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="p-4">
                  <EmptyState message={emptyMessage} action={emptyAction} />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={rowClassName?.(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
          {footer && !isPending && (data?.length ?? 0) > 0 ? (
            <TableFooter>{footer}</TableFooter>
          ) : null}
        </Table>
      </div>

      {pagination && pagination.total > 0 ? (
        <nav
          aria-label={t('table.pagination')}
          className={cn('flex flex-wrap items-center justify-between gap-2 text-sm')}
        >
          <p className="text-muted-foreground">
            {t('table.summary', {
              from: formatNumber((pagination.page - 1) * pagination.pageSize + 1, locale),
              to: formatNumber(
                Math.min(pagination.page * pagination.pageSize, pagination.total),
                locale,
              ),
              total: formatNumber(pagination.total, locale),
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft aria-hidden="true" className="rtl:rotate-180" />
              {t('table.previous')}
            </Button>
            <span className="text-muted-foreground">
              {t('table.page', {
                page: formatNumber(pagination.page, locale),
                pages: formatNumber(pageCount, locale),
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pageCount}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              {t('table.next')}
              <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
