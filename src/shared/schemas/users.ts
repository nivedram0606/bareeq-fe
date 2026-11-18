import { z } from 'zod';

import { ROLES } from '../enums.js';

import { emailSchema, enumOf, requiredText, V } from './common.js';
import { orgSchema } from './org.js';

export const profileSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type ProfileDto = z.infer<typeof profileSchema>;

export const meSchema = z.object({
  profile: profileSchema,
  org: orgSchema,
});
export type MeDto = z.infer<typeof meSchema>;

export const inviteUserSchema = z.object({
  email: emailSchema,
  fullName: requiredText(150),
  role: enumOf(ROLES),
});
export type InviteUserInput = z.input<typeof inviteUserSchema>;

/** Supabase Auth accepts up to 72 characters; 8 is the project's minimum. */
export const passwordSchema = z
  .string({ error: V.passwordShort })
  .min(8, { error: V.passwordShort })
  .max(72, { error: V.tooLong });

/** Admin creates an account directly with a password (no e-mail needed). */
export const createUserSchema = inviteUserSchema.extend({ password: passwordSchema });
export type CreateUserInput = z.input<typeof createUserSchema>;

/** One-time bootstrap of the school's first admin (`POST /setup/admin`). */
export const setupAdminSchema = z.object({
  email: emailSchema,
  fullName: requiredText(150),
  password: passwordSchema,
});
export type SetupAdminInput = z.input<typeof setupAdminSchema>;

export const updateUserSchema = z
  .object({
    role: enumOf(ROLES),
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    error: V.nothingToUpdate,
  });
export type UpdateUserInput = z.input<typeof updateUserSchema>;
