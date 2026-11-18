import { z } from 'zod';

import { PAY_METHODS, STUDENT_STATUS } from '../enums.js';
import { moneyOutSchema } from '../money.js';

import { dateString, enumOf, listQuerySchema, uuidSchema } from './common.js';
import { paymentSchema } from './fees.js';

export const REPORT_NAMES = ['students', 'fee-collection', 'outstanding'] as const;
export type ReportName = (typeof REPORT_NAMES)[number];

/** Report filters; `page`/`pageSize` apply to JSON only — CSV always contains every row. */
export const studentReportQuerySchema = listQuerySchema.extend({
  classId: uuidSchema.optional(),
  status: enumOf(STUDENT_STATUS).optional(),
});
export type StudentReportQuery = z.infer<typeof studentReportQuerySchema>;

export const feeCollectionQuerySchema = listQuerySchema.extend({
  from: dateString.optional(),
  to: dateString.optional(),
  classId: uuidSchema.optional(),
  method: enumOf(PAY_METHODS).optional(),
});
export type FeeCollectionQuery = z.infer<typeof feeCollectionQuerySchema>;

export const outstandingQuerySchema = listQuerySchema.extend({
  classId: uuidSchema.optional(),
  dueBefore: dateString.optional(),
});
export type OutstandingQuery = z.infer<typeof outstandingQuerySchema>;

export const studentReportRowSchema = z.object({
  studentId: z.uuid(),
  admissionNo: z.string(),
  studentName: z.string(),
  nameAr: z.string().nullable(),
  className: z.string().nullable(),
  status: z.enum(STUDENT_STATUS),
  primaryGuardian: z.string().nullable(),
  phone: z.string().nullable(),
});
export type StudentReportRow = z.infer<typeof studentReportRowSchema>;

export const feeCollectionRowSchema = z.object({
  paymentId: z.uuid(),
  paidOn: z.string(),
  studentId: z.uuid(),
  admissionNo: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  feeTitle: z.string(),
  amount: moneyOutSchema,
  method: z.enum(PAY_METHODS),
  reference: z.string().nullable(),
  receivedBy: z.string(),
});
export type FeeCollectionRow = z.infer<typeof feeCollectionRowSchema>;

export const outstandingRowSchema = z.object({
  feeItemId: z.uuid(),
  studentId: z.uuid(),
  admissionNo: z.string(),
  studentName: z.string(),
  className: z.string().nullable(),
  feeTitle: z.string(),
  netDue: moneyOutSchema,
  paid: moneyOutSchema,
  outstanding: moneyOutSchema,
  dueDate: z.string(),
});
export type OutstandingRow = z.infer<typeof outstandingRowSchema>;

const report = <T extends z.ZodType, S extends z.ZodRawShape>(row: T, totals: S) =>
  z.object({
    data: z.array(row),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totals: z.object(totals),
  });

export const studentReportSchema = report(studentReportRowSchema, {});
export type StudentReportDto = z.infer<typeof studentReportSchema>;

export const feeCollectionReportSchema = report(feeCollectionRowSchema, {
  collected: moneyOutSchema,
});
export type FeeCollectionReportDto = z.infer<typeof feeCollectionReportSchema>;

export const outstandingReportSchema = report(outstandingRowSchema, {
  outstanding: moneyOutSchema,
});
export type OutstandingReportDto = z.infer<typeof outstandingReportSchema>;

/* -------------------------------------------------------------- dashboard */

export const recentPaymentSchema = paymentSchema.extend({
  studentName: z.string(),
  feeTitle: z.string(),
});
export type RecentPaymentDto = z.infer<typeof recentPaymentSchema>;

export const dashboardSchema = z.object({
  activeStudents: z.number().int(),
  collectedThisMonth: moneyOutSchema,
  totalOutstanding: moneyOutSchema,
  recentPayments: z.array(recentPaymentSchema),
});
export type DashboardDto = z.infer<typeof dashboardSchema>;
