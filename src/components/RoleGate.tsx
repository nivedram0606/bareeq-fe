import type { ReactNode } from 'react';

import type { Role } from '@bareeq/shared';

import { useHasRole } from './useHasRole';

/**
 * Renders children only for the given roles. UI convenience only — the API enforces
 * permissions on every request.
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: readonly Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useHasRole(roles) ? children : fallback;
}
