import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { enumOf, LOCALES, optionalText, requiredText } from '@bareeq/shared';
import type { OrgDto } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { applyServerErrors } from '@/lib/forms';
import { TestIdScope } from '@/lib/testId';

import { useOrg, useUpdateOrg } from './api';

/** Same rules as the shared `updateOrgSchema`, with every field present (a full form). */
const orgFormSchema = z.object({
  name: requiredText(150),
  nameAr: optionalText(150),
  defaultLocale: enumOf(LOCALES),
});
type Input_ = z.input<typeof orgFormSchema>;
type Output = z.output<typeof orgFormSchema>;
const FIELDS = ['name', 'nameAr', 'defaultLocale'] as const;

function OrgForm({ org }: { org: OrgDto }) {
  const { t } = useTranslation();
  const update = useUpdateOrg();
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: { name: org.name, nameAr: org.nameAr ?? '', defaultLocale: org.defaultLocale },
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      form.reset({
        name: saved.name,
        nameAr: saved.nameAr ?? '',
        defaultLocale: saved.defaultLocale,
      });
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <form
      noValidate
      onSubmit={(e) => void onSubmit(e)}
      className="grid gap-4"
      data-testid="settings-org-form"
    >
      <FormField label={t('settings.schoolName')} error={errors.name?.message} required>
        <Input autoComplete="organization" {...form.register('name')} />
      </FormField>
      <FormField label={t('settings.schoolNameAr')} error={errors.nameAr?.message}>
        <Input dir="rtl" lang="ar" autoComplete="off" {...form.register('nameAr')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('settings.currency')} hint={t('settings.currencyHint')}>
          <Input value={org.currency} readOnly disabled data-testid="settings-org-currency" />
        </FormField>
        <FormField
          label={t('settings.defaultLocale')}
          error={errors.defaultLocale?.message}
          hint={t('settings.defaultLocaleHint')}
          required
        >
          <NativeSelect {...form.register('defaultLocale')}>
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {t(`languages.${l}`)}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} data-testid="settings-org-submit">
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export function OrgSettingsPage() {
  const { t } = useTranslation();
  const org = useOrg();
  return (
    <TestIdScope id="settings-org">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t('settings.orgTitle')} description={t('settings.orgSubtitle')} />
        <Card>
          <CardContent>
            {org.isPending ? (
              <Skeleton className="h-64" />
            ) : org.isError ? (
              <ErrorState error={org.error} onRetry={() => void org.refetch()} />
            ) : (
              <OrgForm org={org.data} />
            )}
          </CardContent>
        </Card>
      </div>
    </TestIdScope>
  );
}
