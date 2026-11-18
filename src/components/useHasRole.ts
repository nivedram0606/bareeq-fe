import { hasRole } from '@bareeq/shared';
import type { Role } from '@bareeq/shared';

import { useAuthStore } from '@/stores/auth.store';

/** True if the current user has one of `roles` (UI convenience; the API enforces access). */
export function useHasRole(roles: readonly Role[]): boolean {
  return useAuthStore((s) => hasRole(s.profile?.role, roles));
}
