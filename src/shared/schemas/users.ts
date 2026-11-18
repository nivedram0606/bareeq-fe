import { z } from 'zod';

import { ROLES } from '../enums.js';

import { enumOf, optionalEmail, requiredText, V } from './common.js';
import { orgSchema } from './org.js';

export const profileSchema = z.object({
  id: z.uuid(),
  orgId: z.uuid(),
  username: z.string(),
  fullName: z.string(),
  email: z.string().nullable(),
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

/**
 * Login name for new accounts: 3–50 characters of lower-case letters, digits, `.`, `_` or `-`.
 * Stored and compared in lower case.
 */
export const usernameSchema = z
  .string({ error: V.invalidUsername })
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(3, { error: V.invalidUsername })
      .max(50, { error: V.tooLong })
      .regex(/^[a-z0-9._-]+$/, { error: V.invalidUsername }),
  );

/** bcrypt only uses the first 72 bytes; 8 is the project's minimum. */
export const passwordSchema = z
  .string({ error: V.passwordShort })
  .min(8, { error: V.passwordShort })
  .max(72, { error: V.tooLong });

/** `POST /auth/login`. The username is not format-checked so legacy (e-mail) usernames work. */
export const loginSchema = z.object({
  username: z
    .string({ error: V.required })
    .trim()
    .toLowerCase()
    .min(1, { error: V.required })
    .max(254, { error: V.tooLong }),
  password: z.string({ error: V.required }).min(1, { error: V.required }).max(200),
});
export type LoginInput = z.input<typeof loginSchema>;

export const loginResponseSchema = z.object({
  token: z.string(),
  /** ISO timestamp when the token stops being accepted. */
  expiresAt: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/** `POST /auth/change-password` (signed-in user changes their own password). */
export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: V.required }).min(1, { error: V.required }).max(200),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/** Admin creates an account with a username and an initial password. */
export const createUserSchema = z.object({
  username: usernameSchema,
  fullName: requiredText(150),
  email: optionalEmail,
  role: enumOf(ROLES),
  password: passwordSchema,
});
export type CreateUserInput = z.input<typeof createUserSchema>;

/** Admin sets a new password for another user (`PUT /users/:id/password`). */
export const resetUserPasswordSchema = z.object({ password: passwordSchema });
export type ResetUserPasswordInput = z.input<typeof resetUserPasswordSchema>;

/** One-time bootstrap of the school's first admin (`POST /setup/admin`). */
export const setupAdminSchema = z.object({
  username: usernameSchema,
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
