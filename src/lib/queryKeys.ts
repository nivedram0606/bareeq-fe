import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { QueryParams } from './api';

/** Query-key factories shared across features (hierarchical so prefixes invalidate). */
export const studentKeys = {
  all: ['students'] as const,
  list: (q: QueryParams) => ['students', 'list', q] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
  guardians: (id: string) => ['students', 'detail', id, 'guardians'] as const,
  fees: (id: string) => ['students', 'detail', id, 'fees'] as const,
};

export const classKeys = {
  all: ['classes'] as const,
  list: (q: QueryParams) => ['classes', 'list', q] as const,
};

export const yearKeys = {
  all: ['academic-years'] as const,
  list: (q: QueryParams) => ['academic-years', 'list', q] as const,
};

export const staffKeys = {
  all: ['staff'] as const,
  list: (q: QueryParams) => ['staff', 'list', q] as const,
};

export const userKeys = {
  all: ['users'] as const,
  list: (q: QueryParams) => ['users', 'list', q] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  report: (name: string, q: QueryParams) => ['reports', name, q] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
};

export function invalidate(qc: QueryClient, ...keys: QueryKey[]): void {
  for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
}
