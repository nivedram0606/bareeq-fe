import { describe, expect, it } from 'vitest';

import { balanceStatus, isOverpaid, outstandingOf } from './balance.js';

describe('balance status', () => {
  it('is unpaid when nothing was paid', () => {
    expect(balanceStatus('100.000', '0.000')).toBe('unpaid');
  });

  it('is partial when something but not all was paid', () => {
    expect(balanceStatus('100.000', '40.000')).toBe('partial');
    expect(balanceStatus('100.000', '99.999')).toBe('partial');
  });

  it('is paid when paid equals or exceeds net due', () => {
    expect(balanceStatus('100.000', '100.000')).toBe('paid');
    expect(balanceStatus('100.000', '120.000')).toBe('paid');
  });

  it('treats a fully discounted fee as paid', () => {
    expect(balanceStatus('0.000', '0.000')).toBe('paid');
  });

  it('computes outstanding exactly and flags overpayment', () => {
    expect(outstandingOf('100.000', '40.000')).toBe('60.000');
    expect(outstandingOf('0.3', '0.1')).toBe('0.200');
    expect(outstandingOf('25.500', '30.000')).toBe('-4.500');
    expect(isOverpaid('-4.500')).toBe(true);
    expect(isOverpaid('0.000')).toBe(false);
  });
});
