import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, Spinner } from '@/components/ui/misc';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

import { AuthLayout } from './AuthLayout';

const resetSchema = z
  .object({
    password: z.string().min(8, { error: 'auth.errors.password_short' }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    error: 'auth.errors.password_mismatch',
    path: ['confirm'],
  });
type ResetValues = z.infer<typeof resetSchema>;

/** The link's own error, e.g. `#error=access_denied&error_description=...` for expired links. */
const linkHasError = (): boolean =>
  /(^|[#&?])error(_code|_description)?=/.test(window.location.hash + window.location.search);

/**
 * Target of password-reset and invite e-mails. supabase-js turns the link's tokens into a session;
 * the user then chooses a password.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const hasSession = useAuthStore((s) => Boolean(s.session));
  const [failed, setFailed] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setFailed(false);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFailed(true);
      return;
    }
    toast.success(t('auth.passwordUpdated'));
    await navigate('/', { replace: true });
  });

  let content;
  if (!hasSession && (linkHasError() || status === 'unauthenticated')) {
    content = (
      <div className="grid gap-4">
        <Alert variant="destructive">{t('auth.resetLinkInvalid')}</Alert>
        <Button asChild variant="outline">
          <Link to="/login">{t('auth.backToSignIn')}</Link>
        </Button>
      </div>
    );
  } else if (!hasSession) {
    content = <Spinner label={t('auth.checkingLink')} className="mx-auto" />;
  } else {
    content = (
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
        {failed ? <Alert variant="destructive">{t('auth.errors.generic')}</Alert> : null}
        <FormField
          label={t('auth.newPassword')}
          error={form.formState.errors.password?.message}
          required
        >
          <Input type="password" autoComplete="new-password" {...form.register('password')} />
        </FormField>
        <FormField
          label={t('auth.confirmPassword')}
          error={form.formState.errors.confirm?.message}
          required
        >
          <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
        </FormField>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.saving') : t('auth.savePassword')}
        </Button>
      </form>
    );
  }

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      {content}
    </AuthLayout>
  );
}
