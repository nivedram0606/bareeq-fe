import type { Locale } from '@bareeq/shared';

/** Student name in the UI language: the Arabic name when viewing in Arabic and one exists. */
export function studentName(
  s: { firstName: string; lastName: string; nameAr?: string | null },
  locale: Locale,
): string {
  return locale === 'ar' && s.nameAr ? s.nameAr : `${s.firstName} ${s.lastName}`;
}
