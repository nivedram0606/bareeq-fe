import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { passwordSchema, V } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyServerErrors, toastSuccess } from '@/lib/forms';
import { TestIdScope } from '@/lib/testId';
import { useAuthStore } from '@/stores/auth.store';

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, { error: V.required }),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    error: 'auth.errors.password_mismatch',
    path: ['confirm'],
  });
type ChangeValues = z.infer<typeof changeSchema>;

/** The signed-in user changes their own password. Other devices are signed out. */
export function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const changePassword = useAuthStore((s) => s.changePassword);
  const form = useForm<ChangeValues>({
    resolver: zodResolver(changeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      toastSuccess('auth.passwordUpdated');
      await navigate('/', { replace: true });
    } catch (err) {
      applyServerErrors(err, form.setError, ['currentPassword', 'newPassword']);
    }
  });

  return (
    <TestIdScope id="change-password">
      <PageHeader
        title={t('auth.changePasswordTitle')}
        description={t('auth.changePasswordHint')}
      />
      <Card className="max-w-md">
        <CardContent>
          <form
            noValidate
            onSubmit={(e) => void onSubmit(e)}
            className="grid gap-4"
            data-testid="change-password-form"
          >
            <FormField
              label={t('auth.currentPassword')}
              error={errors.currentPassword?.message}
              required
            >
              <Input
                type="password"
                autoComplete="current-password"
                {...form.register('currentPassword')}
              />
            </FormField>
            <FormField
              label={t('auth.newPassword')}
              error={errors.newPassword?.message}
              hint={t('users.initialPasswordHint')}
              required
            >
              <Input
                type="password"
                autoComplete="new-password"
                {...form.register('newPassword')}
              />
            </FormField>
            <FormField label={t('auth.confirmPassword')} error={errors.confirm?.message} required>
              <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
            </FormField>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="justify-self-start"
              data-testid="change-password-submit"
            >
              {isSubmitting ? t('auth.saving') : t('auth.savePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </TestIdScope>
  );
}
