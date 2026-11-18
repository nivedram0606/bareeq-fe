import type { BalanceStatus } from './enums.js';
import { fromBaisa, toBaisa } from './money.js';

/**
 * Mirrors the status rule of the `v_fee_balances` SQL view (which remains the source of truth):
 * `paid` if paid ≥ net due, `partial` if anything was paid, else `unpaid`.
 */
export function balanceStatus(netDue: string, paid: string): BalanceStatus {
  const due = toBaisa(netDue);
  const p = toBaisa(paid);
  if (p >= due) return 'paid';
  if (p > 0n) return 'partial';
  return 'unpaid';
}

/** Outstanding = net due − paid (negative when overpaid). */
export const outstandingOf = (netDue: string, paid: string): string =>
  fromBaisa(toBaisa(netDue) - toBaisa(paid));

export const isOverpaid = (outstanding: string): boolean => toBaisa(outstanding) < 0n;
