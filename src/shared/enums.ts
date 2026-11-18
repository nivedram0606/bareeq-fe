export const ROLES = ['admin', 'staff', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const STUDENT_STATUS = ['active', 'inactive'] as const;
export type RecordStatus = (typeof STUDENT_STATUS)[number];

export const PAY_METHODS = ['cash', 'bank_transfer', 'card', 'cheque', 'other'] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export const BALANCE_STATUS = ['paid', 'partial', 'unpaid'] as const;
export type BalanceStatus = (typeof BALANCE_STATUS)[number];

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const AUDIT_ACTIONS = ['create', 'update', 'void', 'status_change'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
