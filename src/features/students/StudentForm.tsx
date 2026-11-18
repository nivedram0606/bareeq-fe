import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import type { z } from 'zod';

import { createStudentSchema, GENDERS, STUDENT_STATUS } from '@bareeq/shared';
import type { StudentDto } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { useClassOptions } from '@/features/classes/api';
import { todayIso } from '@/lib/format';
import { applyServerErrors } from '@/lib/forms';

import { useCreateStudent, useStudent, useUpdateStudent } from './api';

type Input_ = z.input<typeof createStudentSchema>;
type Output = z.output<typeof createStudentSchema>;

const FIELDS = [
  'admissionNo',
  'firstName',
  'lastName',
  'nameAr',
  'dob',
  'gender',
  'classId',
  'status',
  'joinedOn',
] as const;

function StudentFormBody({ student }: { student?: StudentDto }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const classes = useClassOptions();
  const create = useCreateStudent();
  const update = useUpdateStudent(student?.id ?? '');

  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: student
      ? {
          admissionNo: student.admissionNo,
          firstName: student.firstName,
          lastName: student.lastName,
          nameAr: student.nameAr ?? '',
          dob: student.dob,
          gender: student.gender,
          classId: student.classId ?? '',
          status: student.status,
          joinedOn: student.joinedOn,
        }
      : { status: 'active', joinedOn: todayIso(), classId: '', nameAr: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = student ? await update.mutateAsync(values) : await create.mutateAsync(values);
      await navigate(`/students/${saved.id}`);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  const cancelTo = student ? `/students/${student.id}` : '/students';

  return (
    <Card>
      <CardContent>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label={t('students.admissionNo')}
              error={errors.admissionNo?.message}
              required
            >
              <Input autoComplete="off" dir="ltr" {...form.register('admissionNo')} />
            </FormField>
            <FormField label={t('students.class')} error={errors.classId?.message}>
              <NativeSelect {...form.register('classId')}>
                <option value="">{t('students.noClass')}</option>
                {classes.data?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.academicYearName}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={t('students.firstName')} error={errors.firstName?.message} required>
              <Input autoComplete="off" {...form.register('firstName')} />
            </FormField>
            <FormField label={t('students.lastName')} error={errors.lastName?.message} required>
              <Input autoComplete="off" {...form.register('lastName')} />
            </FormField>
            <FormField
              label={t('students.nameAr')}
              error={errors.nameAr?.message}
              className="md:col-span-2"
            >
              <Input autoComplete="off" dir="rtl" lang="ar" {...form.register('nameAr')} />
            </FormField>
            <FormField label={t('students.dob')} error={errors.dob?.message} required>
              <Input type="date" {...form.register('dob')} />
            </FormField>
            <FormField label={t('students.gender')} error={errors.gender?.message} required>
              <NativeSelect {...form.register('gender')}>
                <option value="">{t('common.select')}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {t(`gender.${g}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={t('students.status')} error={errors.status?.message} required>
              <NativeSelect {...form.register('status')}>
                {STUDENT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}`)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={t('students.joinedOn')} error={errors.joinedOn?.message} required>
              <Input type="date" {...form.register('joinedOn')} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link to={cancelTo}>{t('common.cancel')}</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Create (`/students/new`) and edit (`/students/:id/edit`) student page. */
export function StudentFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const student = useStudent(id ?? '');
  const isEdit = Boolean(id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={isEdit ? t('students.edit') : t('students.new')} />
      {!isEdit ? (
        <StudentFormBody />
      ) : student.isPending ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : student.isError ? (
        <ErrorState error={student.error} onRetry={() => void student.refetch()} />
      ) : (
        <StudentFormBody student={student.data} />
      )}
    </div>
  );
}
