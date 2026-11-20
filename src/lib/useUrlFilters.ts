import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * List filters kept in the URL query string (shareable, survive reload and back/forward).
 * Changing any filter other than `page` resets to page 1.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();

  const values = useMemo(() => {
    const out = {} as Record<K, string>;
    for (const key of keys) out[key] = params.get(key) ?? '';
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `keys` is a constant list
  }, [params]);

  const page = Math.max(1, Number(params.get('page')) || 1);

  const setFilters = useCallback(
    (patch: Partial<Record<K | 'page', string | number>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const v = value === undefined || value === null ? '' : String(value);
            if (v === '' || (key === 'page' && v === '1')) next.delete(key);
            else next.set(key, v);
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  /** True when any filter (not the page number) has a value. */
  const isFiltered = keys.some((key) => values[key] !== '');

  /** Removes every filter and returns to page 1. */
  const clearFilters = useCallback(() => {
    const patch: Partial<Record<K | 'page', string>> = {};
    for (const key of keys) patch[key] = '';
    setFilters(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `keys` is a constant list
  }, [setFilters]);

  return { values, page, setFilters, isFiltered, clearFilters };
}
