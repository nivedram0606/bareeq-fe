import { describe, expect, it } from 'vitest';

import { foregroundFor } from './brand';
import { formatDate, formatMoney } from './format';

/** Intl uses non-breaking / bidi marks; normalise them for readable assertions. */
const SPACES = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g');
const BIDI_MARKS = new RegExp(`[${String.fromCharCode(0x200e, 0x200f, 0x61c)}]`, 'g');
const plain = (s: string) => s.replace(SPACES, ' ').replace(BIDI_MARKS, '');

describe('formatMoney', () => {
  it('formats OMR with 3 decimals in English', () => {
    expect(plain(formatMoney('125.5', 'en'))).toBe('OMR 125.500');
    expect(plain(formatMoney('0', 'en'))).toBe('OMR 0.000');
    expect(plain(formatMoney('1234567.891', 'en'))).toBe('OMR 1,234,567.891');
  });

  it('formats negative (overpaid) amounts', () => {
    expect(plain(formatMoney('-4.500', 'en'))).toBe('-OMR 4.500');
  });

  it('formats with Arabic-Indic digits and the rial symbol in Arabic', () => {
    expect(plain(formatMoney('125.500', 'ar'))).toBe('١٢٥٫٥٠٠ ر.ع.');
  });

  it('keeps full precision of decimal strings (no float rounding)', () => {
    expect(plain(formatMoney('999999999.999', 'en'))).toBe('OMR 999,999,999.999');
  });
});

describe('formatDate', () => {
  it('formats calendar dates without timezone shifts', () => {
    expect(formatDate('2026-09-01', 'en')).toBe('Sep 1, 2026');
    expect(formatDate('', 'en')).toBe('');
  });
});

describe('brand colour', () => {
  it('picks a readable foreground', () => {
    expect(foregroundFor('#0f766e')).toBe('#ffffff');
    expect(foregroundFor('#fde047')).toBe('#0f172a');
  });
});
