import { z } from 'zod';

import { optionalEmail, optionalText, requiredText } from './common.js';

export const guardianSchema = z.object({
  id: z.uuid(),
  studentId: z.uuid(),
  name: z.string(),
  relation: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  isPrimary: z.boolean(),
});
export type GuardianDto = z.infer<typeof guardianSchema>;

const guardianFields = z.object({
  name: requiredText(150),
  relation: requiredText(50),
  phone: optionalText(30),
  email: optionalEmail,
  isPrimary: z.boolean(),
});

export const createGuardianSchema = guardianFields.extend({
  isPrimary: z.boolean().default(false),
});
export type CreateGuardianInput = z.input<typeof createGuardianSchema>;

export const updateGuardianSchema = guardianFields.partial();
export type UpdateGuardianInput = z.input<typeof updateGuardianSchema>;
