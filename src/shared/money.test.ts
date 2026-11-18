import { describe, expect, it } from 'vitest';

import { fromBaisa, moneySchema, normalizeMoney, positiveMoneySchema, toBaisa } from './money.js';

describe('money', () => {
  it('converts to and from integer baisa', () => {
    expect(toBaisa('125.5')).toBe(125500n);
    expect(toBaisa('0.001')).toBe(1n);
    expect(toBaisa('-4.5')).toBe(-4500n);
    expect(fromBaisa(125500n)).toBe('125.500');
    expect(fromBaisa(-4500n)).toBe('-4.500');
    expect(fromBaisa(0n)).toBe('0.000');
  });

  it('adds without floating point error', () => {
    expect(fromBaisa(toBaisa('0.1') + toBaisa('0.2'))).toBe('0.300');
  });

  it('normalises to 3 decimals', () => {
    expect(normalizeMoney('7')).toBe('7.000');
    expect(normalizeMoney('7.25')).toBe('7.250');
  });

  it('rejects malformed values', () => {
    expect(() => toBaisa('1.2345')).toThrow();
    expect(() => toBaisa('abc')).toThrow();
  });

  it('moneySchema validates and normalises input', () => {
    expect(moneySchema.parse(' 100 ')).toBe('100.000');
    expect(moneySchema.safeParse('-1').success).toBe(false);
    expect(moneySchema.safeParse('1.2345').success).toBe(false);
    expect(moneySchema.safeParse('').error?.issues[0]?.message).toBe('validation.required');
  });

  it('positiveMoneySchema rejects zero', () => {
    expect(positiveMoneySchema.safeParse('0').success).toBe(false);
    expect(positiveMoneySchema.parse('0.001')).toBe('0.001');
  });
});
