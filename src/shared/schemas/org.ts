import { z } from 'zod';

import { LOCALES } from '../enums.js';

import { enumOf, hexColor, optionalText, requiredText } from './common.js';

export const orgSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  nameAr: z.string().nullable(),
  currency: z.string(),
  defaultLocale: z.enum(LOCALES),
  brandColor: z.string(),
  logoPath: z.string().nullable(),
  /** Logo URL relative to the API base (e.g. `/orgs/<id>/logo?v=…`), or null. */
  logoUrl: z.string().nullable(),
});
export type OrgDto = z.infer<typeof orgSchema>;

/** Public branding shown before sign-in (login page). */
export const brandingSchema = orgSchema.pick({
  name: true,
  nameAr: true,
  defaultLocale: true,
  brandColor: true,
  logoUrl: true,
});
export type BrandingDto = z.infer<typeof brandingSchema>;

export const updateOrgSchema = z
  .object({
    name: requiredText(150),
    nameAr: optionalText(150),
    defaultLocale: enumOf(LOCALES),
    brandColor: hexColor,
  })
  .partial();
export type UpdateOrgInput = z.input<typeof updateOrgSchema>;

export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
