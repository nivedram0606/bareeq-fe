import { describe, expect, it } from 'vitest';

import { createAcademicYearSchema, updateAcademicYearSchema } from './academicYears.js';
import { listQuerySchema, optionalEmail, optionalText } from './common.js';
import { createFeeSchema } from './fees.js';
import { updateOrgSchema } from './org.js';
import { createUserSchema, loginSchema, updateUserSchema } from './users.js';

describe('common schemas', () => {
  it('listQuery applies defaults, coerces and caps pageSize', () => {
    expect(listQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listQuerySchema.parse({ page: '3', pageSize: '50', search: '  ali ' })).toMatchObject({
      page: 3,
      pageSize: 50,
      search: 'ali',
    });
    expect(listQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listQuerySchema.safeParse({ sort: 'name; drop' }).success).toBe(false);
  });

  it('optional text/email turn empty strings into null', () => {
    expect(optionalText().parse('  ')).toBeNull();
    expect(optionalText().parse(undefined)).toBeNull();
    expect(optionalEmail.parse('')).toBeNull();
    expect(optionalEmail.parse('A@B.COM')).toBe('a@b.com');
    expect(optionalEmail.safeParse('nope').success).toBe(false);
  });
});

describe('org schemas', () => {
  it('validates brand colour and locale', () => {
    expect(updateOrgSchema.parse({ brandColor: '#AABBCC' })).toEqual({ brandColor: '#aabbcc' });
    expect(updateOrgSchema.safeParse({ brandColor: 'red' }).success).toBe(false);
    expect(updateOrgSchema.safeParse({ defaultLocale: 'fr' }).success).toBe(false);
  });
});

describe('user schemas', () => {
  const valid = { username: ' Sara.K ', fullName: 'Sara', role: 'staff', password: 'secret-123' };

  it('create normalises the username and treats a blank e-mail as none', () => {
    expect(createUserSchema.parse({ ...valid, email: '' })).toEqual({
      username: 'sara.k',
      fullName: 'Sara',
      email: null,
      role: 'staff',
      password: 'secret-123',
    });
  });

  it('create rejects bad usernames, short passwords, empty names and unknown roles', () => {
    for (const bad of [
      { username: 'ab' },
      { username: 'has space' },
      { username: 'x@y.com' },
      { password: 'short' },
      { fullName: '' },
      { role: 'owner' },
    ]) {
      expect(createUserSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });

  it('login accepts legacy e-mail usernames, lower-cased', () => {
    expect(loginSchema.parse({ username: ' Admin@School.om ', password: 'x' })).toEqual({
      username: 'admin@school.om',
      password: 'x',
    });
    expect(loginSchema.safeParse({ username: '', password: 'x' }).success).toBe(false);
  });

  it('update requires at least one field', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });
});

describe('academic year schemas', () => {
  const valid = { name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30' };

  it('defaults isCurrent and requires end after start', () => {
    expect(createAcademicYearSchema.parse(valid).isCurrent).toBe(false);
    const bad = createAcademicYearSchema.safeParse({ ...valid, endDate: '2026-08-01' });
    expect(bad.error?.issues[0]).toMatchObject({
      path: ['endDate'],
      message: 'validation.end_before_start',
    });
  });

  it('rejects invalid dates', () => {
    expect(createAcademicYearSchema.safeParse({ ...valid, startDate: '2026-13-01' }).success).toBe(
      false,
    );
  });

  it('update allows partial input', () => {
    expect(updateAcademicYearSchema.parse({ isCurrent: true })).toEqual({ isCurrent: true });
  });
});

describe('fee schemas', () => {
  const studentId = '00000000-0000-4000-8000-000000000001';

  it('reports every missing field instead of throwing (BUG-0004)', () => {
    const res = createFeeSchema.safeParse({ studentId, title: '', amount: '', dueDate: '' });
    expect(res.success).toBe(false);
    const fields = [...new Set(res.error?.issues.map((i) => i.path.join('.')))].sort();
    expect(fields).toEqual(['amount', 'dueDate', 'title']);
  });

  it('still rejects a discount larger than the amount', () => {
    const res = createFeeSchema.safeParse({
      studentId,
      title: 'Tuition',
      amount: '10',
      discount: '12',
      dueDate: '2026-10-01',
    });
    expect(res.error?.issues).toMatchObject([
      { path: ['discount'], message: 'validation.discount_too_large' },
    ]);
  });
});
