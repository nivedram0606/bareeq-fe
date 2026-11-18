import { z } from 'zod';

/**
 * Validation messages are i18n keys (resolved by the web app with `t()`), so the same
 * schemas give translated errors in English and Arabic.
 */
export const V = {
  required: 'validation.required',
  tooLong: 'validation.too_long',
  invalidId: 'validation.invalid_id',
  invalidDate: 'validation.invalid_date',
  invalidEmail: 'validation.invalid_email',
  invalidMoney: 'validation.invalid_money',
  invalidColor: 'validation.invalid_color',
  invalidChoice: 'validation.invalid_choice',
  endBeforeStart: 'validation.end_before_start',
  nothingToUpdate: 'validation.nothing_to_update',
  invalidSort: 'validation.invalid_sort',
  discountTooLarge: 'validation.discount_too_large',
  passwordShort: 'validation.password_short',
} as const;

export const uuidSchema = z.uuid({ error: V.invalidId });
export const idParamSchema = z.object({ id: uuidSchema });

/** Optional reference; `''` (an empty <select>) and `null` both mean "none". */
export const optionalUuid = z
  .union([z.literal(''), uuidSchema])
  .nullish()
  .transform((v) => (v ? v : null));
export type IdParam = z.infer<typeof idParamSchema>;

/** Non-empty trimmed text. */
export const requiredText = (max = 200) =>
  z
    .string({ error: V.required })
    .trim()
    .min(1, { error: V.required })
    .max(max, { error: V.tooLong });

/** Optional trimmed text; empty string becomes `null` (clears the value). */
export const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, { error: V.tooLong })
    .nullish()
    .transform((v) => (v ? v : null));

/** Trimmed, lower-cased e-mail. */
export const emailSchema = z
  .string({ error: V.invalidEmail })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: V.invalidEmail }));

/** Optional e-mail; empty string becomes `null`. */
export const optionalEmail = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null))
  .pipe(emailSchema.nullable());

/** ISO calendar date `YYYY-MM-DD`. */
export const dateString = z.iso.date({ error: V.invalidDate });

export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, { error: V.invalidColor })
  .transform((v) => v.toLowerCase());

export const enumOf = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, { error: V.invalidChoice });

/* ------------------------------------------------------------- pagination */

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  /** Field name, prefixed with `-` for descending (e.g. `-createdAt`). */
  sort: z
    .string()
    .regex(/^-?[a-zA-Z]+$/, { error: V.invalidSort })
    .optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

/* ----------------------------------------------------------------- errors */

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    /** For VALIDATION_ERROR: field path (dot-joined) → message key. */
    details: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;
