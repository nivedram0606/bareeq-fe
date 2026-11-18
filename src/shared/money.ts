import { z } from 'zod';

import { V } from './schemas/common.js';

/**
 * Money is exchanged as a decimal string with exactly 3 places (OMR baisa), e.g. "125.500".
 * Arithmetic is done on integer baisa (bigint) to avoid floating-point error.
 */
const MONEY_RE = /^\d{1,9}(\.\d{1,3})?$/;
const SIGNED_MONEY_RE = /^-?\d{1,12}(\.\d{1,3})?$/;

/** Parses "12.5" / "12.500" / "-4.5" into integer baisa. Throws on invalid input. */
export function toBaisa(value: string): bigint {
  const v = value.trim();
  if (!SIGNED_MONEY_RE.test(v)) throw new Error(`Invalid money value: ${value}`);
  const negative = v.startsWith('-');
  const [whole = '0', frac = ''] = (negative ? v.slice(1) : v).split('.');
  const baisa = BigInt(whole) * 1000n + BigInt(frac.padEnd(3, '0'));
  return negative ? -baisa : baisa;
}

/** Formats integer baisa as a 3-decimal string, e.g. 125500n → "125.500". */
export function fromBaisa(baisa: bigint): string {
  const negative = baisa < 0n;
  const abs = negative ? -baisa : baisa;
  const whole = abs / 1000n;
  const frac = (abs % 1000n).toString().padStart(3, '0');
  return `${negative ? '-' : ''}${whole}.${frac}`;
}

/** Normalises any valid money string to exactly 3 decimals. */
export const normalizeMoney = (value: string): string => fromBaisa(toBaisa(value));

/** Non-negative amount input (e.g. fee amount, discount), normalised to "0.000" form. */
export const moneySchema = z
  .string({ error: V.required })
  .trim()
  .min(1, { error: V.required })
  .regex(MONEY_RE, { error: V.invalidMoney })
  .transform(normalizeMoney);

/** Strictly positive amount (payments). */
export const positiveMoneySchema = moneySchema.refine((v) => toBaisa(v) > 0n, {
  error: V.invalidMoney,
});

/** Money as returned by the API (may be negative, e.g. overpaid outstanding). */
export const moneyOutSchema = z.string().regex(/^-?\d+\.\d{3}$/);
