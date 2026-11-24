import type { TFunction } from 'i18next';

/** The name the backend seed gives the first admin account (bareeq-be src/db/seed.ts). */
const SEED_ADMIN_NAME = 'School Administrator';

/**
 * A person's name as entered, except the seeded admin's default name, which is a label rather than
 * a real name and is shown in the current language.
 */
export function displayName(fullName: string, t: TFunction): string {
  return fullName.trim() === SEED_ADMIN_NAME ? t('header.defaultAdminName') : fullName;
}
