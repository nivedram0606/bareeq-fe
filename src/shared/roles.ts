import type { Role } from './enums.js';

/** Role groups mirroring the permission matrix (admin ⊃ staff ⊃ viewer). */
export const ANY_ROLE: readonly Role[] = ['admin', 'staff', 'viewer'];
export const STAFF_OR_ADMIN: readonly Role[] = ['admin', 'staff'];
export const ADMIN_ONLY: readonly Role[] = ['admin'];

export function hasRole(role: Role | null | undefined, allowed: readonly Role[]): boolean {
  return role != null && allowed.includes(role);
}

export const canWrite = (role: Role | null | undefined): boolean => hasRole(role, STAFF_OR_ADMIN);
export const isAdmin = (role: Role | null | undefined): boolean => hasRole(role, ADMIN_ONLY);
