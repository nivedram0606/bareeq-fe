import { describe, expect, it } from 'vitest';

import { canWrite, hasRole, isAdmin, STAFF_OR_ADMIN } from './roles.js';

describe('role helpers', () => {
  it('hasRole checks membership', () => {
    expect(hasRole('staff', STAFF_OR_ADMIN)).toBe(true);
    expect(hasRole('viewer', STAFF_OR_ADMIN)).toBe(false);
    expect(hasRole(null, STAFF_OR_ADMIN)).toBe(false);
  });

  it('canWrite allows admin and staff only', () => {
    expect(canWrite('admin')).toBe(true);
    expect(canWrite('staff')).toBe(true);
    expect(canWrite('viewer')).toBe(false);
  });

  it('isAdmin allows admin only', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('staff')).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});
