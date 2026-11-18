import { z } from 'zod';

import { listQuerySchema, optionalText, requiredText, uuidSchema } from './common.js';

export const classSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  grade: z.string(),
  section: z.string().nullable(),
  academicYearId: z.uuid(),
  academicYearName: z.string(),
  /** Number of active students in the class. */
  studentCount: z.number().int(),
});
export type ClassDto = z.infer<typeof classSchema>;

export const createClassSchema = z.object({
  name: requiredText(100),
  grade: requiredText(50),
  section: optionalText(20),
  academicYearId: uuidSchema,
});
export type CreateClassInput = z.input<typeof createClassSchema>;

export const updateClassSchema = createClassSchema.partial();
export type UpdateClassInput = z.input<typeof updateClassSchema>;

export const classListQuerySchema = listQuerySchema.extend({
  academicYearId: uuidSchema.optional(),
});
export type ClassListQuery = z.infer<typeof classListQuerySchema>;
