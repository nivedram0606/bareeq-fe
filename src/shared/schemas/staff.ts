import { z } from 'zod';

import { STUDENT_STATUS } from '../enums.js';

import { enumOf, listQuerySchema, optionalEmail, optionalText, requiredText } from './common.js';

export const staffSchema = z.object({
  id: z.uuid(),
  fullName: z.string(),
  designation: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(STUDENT_STATUS),
});
export type StaffDto = z.infer<typeof staffSchema>;

const staffFields = z.object({
  fullName: requiredText(150),
  designation: requiredText(100),
  phone: optionalText(30),
  email: optionalEmail,
  status: enumOf(STUDENT_STATUS),
});

export const createStaffSchema = staffFields.extend({
  status: enumOf(STUDENT_STATUS).default('active'),
});
export type CreateStaffInput = z.input<typeof createStaffSchema>;

export const updateStaffSchema = staffFields.partial();
export type UpdateStaffInput = z.input<typeof updateStaffSchema>;

export const staffListQuerySchema = listQuerySchema.extend({
  status: enumOf(STUDENT_STATUS).optional(),
});
export type StaffListQuery = z.infer<typeof staffListQuerySchema>;
