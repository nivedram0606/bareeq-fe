import { z } from 'zod';

import { dateString, requiredText, V } from './common.js';

export const academicYearSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean(),
});
export type AcademicYearDto = z.infer<typeof academicYearSchema>;

const endAfterStart = (v: { startDate?: string; endDate?: string }) =>
  !v.startDate || !v.endDate || v.endDate > v.startDate;

const base = z.object({
  name: requiredText(50),
  startDate: dateString,
  endDate: dateString,
  isCurrent: z.boolean(),
});

export const createAcademicYearSchema = base
  .extend({ isCurrent: z.boolean().default(false) })
  .refine(endAfterStart, { error: V.endBeforeStart, path: ['endDate'] });
export type CreateAcademicYearInput = z.input<typeof createAcademicYearSchema>;

export const updateAcademicYearSchema = base
  .partial()
  .refine(endAfterStart, { error: V.endBeforeStart, path: ['endDate'] });
export type UpdateAcademicYearInput = z.input<typeof updateAcademicYearSchema>;
