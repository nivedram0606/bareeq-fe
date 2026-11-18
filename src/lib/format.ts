import type { Locale } from '@bareeq/shared';

const intlLocale = (locale: Locale): string => (locale === 'ar' ? 'ar-OM' : 'en-OM');

const moneyFormatters = new Map<Locale, Intl.NumberFormat>();

/**
 * Formats an OMR amount string ("125.500") with 3 decimals: "OMR 125.500" / "١٢٥٫٥٠٠ ر.ع.".
 * The decimal string is passed to Intl directly, so no float rounding happens.
 */
export function formatMoney(value: string, locale: Locale): string {
  let fmt = moneyFormatters.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency',
      currency: 'OMR',
      currencyDisplay: locale === 'ar' ? 'symbol' : 'code',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    moneyFormatters.set(locale, fmt);
  }
  return fmt.format(value as Intl.StringNumericLiteral);
}

/** Formats a `YYYY-MM-DD` date (treated as a calendar date, no timezone shift). */
export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Formats an ISO timestamp in Oman time. */
export function formatDateTime(value: string | null | undefined, locale: Locale): string {
  if (!value) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Muscat',
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

/** Today's calendar date in Oman (YYYY-MM-DD), the default for payment dates. */
export const todayIso = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Muscat' }).format(new Date());
