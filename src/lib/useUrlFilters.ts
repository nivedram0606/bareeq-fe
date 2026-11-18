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

  return { values, page, setFilters };
}
