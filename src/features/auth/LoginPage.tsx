import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';

import { emailSchema, V } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

import { AuthLayout } from './AuthLayout';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: V.required }),
});
type LoginValues = z.infer<typeof loginSchema>;

const forgotSchema = z.object({ email: emailSchema });
type ForgotValues = z.infer<typeof forgotSchema>;

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setFailed(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setFailed(true);
    else setSent(true);
  });

  return (
    <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
      <p className="text-sm text-muted-foreground">{t('auth.forgotSubtitle')}</p>
      {sent ? <Alert>{t('auth.resetLinkSent')}</Alert> : null}
      {failed ? <Alert variant="destructive">{t('auth.errors.generic')}</Alert> : null}
      <FormField label={t('auth.email')} error={form.formState.errors.email?.message} required>
        <Input type="email" autoComplete="email" dir="ltr" {...form.register('email')} />
      </FormField>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
      </Button>
      <Button variant="link" onClick={onBack}>
        {t('auth.backToSignIn')}
      </Button>
    </form>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((s) => s.status);
  const signOutReason = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const [mode, setMode] = useState<'signIn' | 'forgot'>('signIn');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signIn(email, password);
      await navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'auth.errors.generic');
    }
  });

  if (mode === 'forgot') {
    return (
      <AuthLayout title={t('auth.forgotTitle')}>
        <ForgotPasswordForm onBack={() => setMode('signIn')} />
      </AuthLayout>
    );
  }

  const message = error ?? signOutReason;
  return (
    <AuthLayout title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
        {message ? (
          <Alert variant="destructive">
            {t(message, { defaultValue: t('auth.errors.generic') })}
          </Alert>
        ) : null}
        <FormField label={t('auth.email')} error={form.formState.errors.email?.message} required>
          <Input type="email" autoComplete="username" dir="ltr" {...form.register('email')} />
        </FormField>
        <FormField
          label={t('auth.password')}
          error={form.formState.errors.password?.message}
          required
        >
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </FormField>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
        <Button variant="link" onClick={() => setMode('forgot')}>
          {t('auth.forgotPassword')}
        </Button>
      </form>
    </AuthLayout>
  );
}
