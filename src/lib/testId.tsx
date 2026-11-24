import { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';

/**
 * Stable `data-testid` hooks for QA automation (see docs/TEST_IDS.md).
 *
 * IDs are kebab-case `<scope>-<element>[-<qualifier>]`: the scope is the page or dialog
 * (`students`, `staff-form`), and records in tables add their database id
 * (`students-row-<id>-edit`). Shared components (form fields, tables, search, page header, tabs)
 * build their IDs from the nearest {@link TestIdScope}, so pages only name their own controls.
 * IDs never depend on the UI language.
 */

type Part = string | number | null | undefined | false;

/** Joins the non-empty parts with `-`; dots in field paths (`primaryContact.name`) become `-`. */
export function testId(...parts: Part[]): string {
  return parts
    .filter((p): p is string | number => p !== '' && p !== null && p !== undefined && p !== false)
    .map((p) => String(p).replaceAll('.', '-'))
    .join('-');
}

const ScopeContext = createContext('');

/** Sets the prefix for the test IDs of the shared components inside it. */
export function TestIdScope({ id, children }: { id: string; children: ReactNode }) {
  return <ScopeContext.Provider value={id}>{children}</ScopeContext.Provider>;
}

/** The current scope's ID builder: `useTestId()('search')` → `students-search`. */
export function useTestId(): (...parts: Part[]) => string {
  const scope = useContext(ScopeContext);
  return useCallback((...parts: Part[]) => testId(scope, ...parts), [scope]);
}
