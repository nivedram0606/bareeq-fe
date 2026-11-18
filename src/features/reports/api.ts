import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import {
  feeCollectionReportSchema,
  outstandingReportSchema,
  studentReportSchema,
} from '@bareeq/shared';
import type { ReportName } from '@bareeq/shared';

import { apiDownload, apiFetch } from '@/lib/api';
import type { QueryParams } from '@/lib/api';
import { toastError } from '@/lib/forms';
import { reportKeys } from '@/lib/queryKeys';

export function useStudentReport(q: QueryParams) {
  return useQuery({
    queryKey: reportKeys.report('students', q),
    queryFn: ({ signal }) =>
      apiFetch('/reports/students', { query: q, schema: studentReportSchema, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useFeeCollectionReport(q: QueryParams) {
  return useQuery({
    queryKey: reportKeys.report('fee-collection', q),
    queryFn: ({ signal }) =>
      apiFetch('/reports/fee-collection', { query: q, schema: feeCollectionReportSchema, signal }),
    placeholderData: keepPreviousData,
  });
}

export function useOutstandingReport(q: QueryParams) {
  return useQuery({
    queryKey: reportKeys.report('outstanding', q),
    queryFn: ({ signal }) =>
      apiFetch('/reports/outstanding', { query: q, schema: outstandingReportSchema, signal }),
    placeholderData: keepPreviousData,
  });
}

/** Downloads `/reports/<name>.csv` with the same filters as the on-screen report. */
export function useExportCsv(name: ReportName) {
  return useMutation({
    mutationFn: (q: QueryParams) => {
      const { page: _page, pageSize: _pageSize, ...filters } = q;
      return apiDownload(`/reports/${name}.csv`, filters);
    },
    onError: toastError,
  });
}
