import { z } from 'zod';

import { BALANCE_STATUS, PAY_METHODS } from '../enums.js';
import { moneyOutSchema, moneySchema, positiveMoneySchema, toBaisa } from '../money.js';

import {
  dateString,
  enumOf,
  optionalText,
  optionalUuid,
  requiredText,
  uuidSchema,
  V,
} from './common.js';

/* --------------------------------------------------------------- payments */

export const paymentSchema = z.object({
  id: z.uuid(),
  feeItemId: z.uuid(),
  studentId: z.uuid(),
  amount: moneyOutSchema,
  paidOn: z.string(),
  method: z.enum(PAY_METHODS),
  reference: z.string().nullable(),
  receivedById: z.uuid(),
  receivedByName: z.string(),
  voidedAt: z.string().nullable(),
  voidedByName: z.string().nullable(),
  voidReason: z.string().nullable(),
  createdAt: z.string(),
});
export type PaymentDto = z.infer<typeof paymentSchema>;

export const createPaymentSchema = z.object({
  feeItemId: uuidSchema,
  amount: positiveMoneySchema,
  paidOn: dateString,
  method: enumOf(PAY_METHODS),
  reference: optionalText(100),
});
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;

export const voidPaymentSchema = z.object({
  reason: requiredText(500),
});
export type VoidPaymentInput = z.input<typeof voidPaymentSchema>;

/* -------------------------------------------------------------- fee items */

export const balanceSchema = z.object({
  netDue: moneyOutSchema,
  paid: moneyOutSchema,
  outstanding: moneyOutSchema,
  status: z.enum(BALANCE_STATUS),
});
export type BalanceDto = z.infer<typeof balanceSchema>;

export const feeItemSchema = balanceSchema.extend({
  id: z.uuid(),
  studentId: z.uuid(),
  academicYearId: z.uuid().nullable(),
  title: z.string(),
  amount: moneyOutSchema,
  discount: moneyOutSchema,
  dueDate: z.string(),
  /** True when the fee has non-voided payments and therefore can no longer be edited. */
  locked: z.boolean(),
});
export type FeeItemDto = z.infer<typeof feeItemSchema>;

export const feeItemWithPaymentsSchema = feeItemSchema.extend({
  payments: z.array(paymentSchema),
});
export type FeeItemWithPaymentsDto = z.infer<typeof feeItemWithPaymentsSchema>;

export const studentFeesSchema = z.object({
  summary: balanceSchema,
  items: z.array(feeItemWithPaymentsSchema),
});
export type StudentFeesDto = z.infer<typeof studentFeesSchema>;

const discountWithinAmount = (v: { amount?: string; discount?: string }) =>
  v.amount === undefined || v.discount === undefined || toBaisa(v.discount) <= toBaisa(v.amount);

const feeFields = z.object({
  title: requiredText(150),
  academicYearId: optionalUuid,
  amount: moneySchema,
  discount: moneySchema,
  dueDate: dateString,
});

export const createFeeSchema = feeFields
  .extend({
    studentId: uuidSchema,
    discount: moneySchema.default('0.000'),
  })
  .refine(discountWithinAmount, { error: V.discountTooLarge, path: ['discount'] });
export type CreateFeeInput = z.input<typeof createFeeSchema>;

export const updateFeeSchema = feeFields
  .partial()
  .refine(discountWithinAmount, { error: V.discountTooLarge, path: ['discount'] });
export type UpdateFeeInput = z.input<typeof updateFeeSchema>;
