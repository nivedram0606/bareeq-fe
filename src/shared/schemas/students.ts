import { z } from 'zod';

import { GENDERS, STUDENT_STATUS } from '../enums.js';

import {
  dateString,
  enumOf,
  listQuerySchema,
  optionalEmail,
  optionalText,
  optionalUuid,
  phoneSchema,
  requiredText,
  uuidSchema,
} from './common.js';

export const studentSchema = z.object({
  id: z.uuid(),
  admissionNo: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  nameAr: z.string().nullable(),
  dob: z.string(),
  gender: z.enum(GENDERS),
  classId: z.uuid().nullable(),
  className: z.string().nullable(),
  status: z.enum(STUDENT_STATUS),
  joinedOn: z.string(),
  primaryGuardianName: z.string().nullable(),
  primaryGuardianPhone: z.string().nullable(),
  createdAt: z.string(),
});
export type StudentDto = z.infer<typeof studentSchema>;

const studentFields = z.object({
  admissionNo: requiredText(30),
  firstName: requiredText(100),
  lastName: requiredText(100),
  nameAr: optionalText(200),
  dob: dateString,
  gender: enumOf(GENDERS),
  classId: optionalUuid,
  status: enumOf(STUDENT_STATUS),
  joinedOn: dateString,
});

/** The student's main contact person; saved as their primary guardian. */
export const primaryContactSchema = z.object({
  name: requiredText(150),
  relation: requiredText(50),
  phone: phoneSchema,
  email: optionalEmail,
});
export type PrimaryContactInput = z.input<typeof primaryContactSchema>;

export const createStudentSchema = studentFields.extend({
  status: enumOf(STUDENT_STATUS).default('active'),
  primaryContact: primaryContactSchema,
});
export type CreateStudentInput = z.input<typeof createStudentSchema>;

export const updateStudentSchema = studentFields.partial();
export type UpdateStudentInput = z.input<typeof updateStudentSchema>;

export const studentListQuerySchema = listQuerySchema.extend({
  classId: uuidSchema.optional(),
  status: enumOf(STUDENT_STATUS).optional(),
});
export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
