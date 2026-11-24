import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import type { z } from 'zod';

import { loginSchema } from '@bareeq/shared';

import { FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useAuthStore } from '@/stores/auth.store';

import { AuthLayout } from './AuthLayout';

type LoginInput = z.input<typeof loginSchema>;
type LoginOutput = z.output<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const signOutReason = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput, unknown, LoginOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Signing in always lands on the Dashboard (BUG-012), not the page visited before sign-out.
  if (status === 'authenticated') return <Navigate to="/" replace />;

  const onSubmit = form.handleSubmit(async ({ username, password }) => {
    setError(null);
    try {
      await signIn(username, password);
      await navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'auth.errors.generic');
    }
  });

  const message = error ?? signOutReason;
  return (
    <AuthLayout testId="login" title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <form
        noValidate
        onSubmit={(e) => void onSubmit(e)}
        className="grid gap-4"
        data-testid="login-form"
      >
        {message ? (
          <Alert variant="destructive" data-testid="login-error">
            {t(message, { defaultValue: t('auth.errors.generic') })}
          </Alert>
        ) : null}
        <FormField
          label={t('auth.username')}
          error={form.formState.errors.username?.message}
          required
        >
          <Input
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            dir="ltr"
            {...form.register('username')}
          />
        </FormField>
        <FormField
          label={t('auth.password')}
          error={form.formState.errors.password?.message}
          required
        >
          <Input type="password" autoComplete="current-password" {...form.register('password')} />
        </FormField>
        <Button type="submit" disabled={form.formState.isSubmitting} data-testid="login-submit">
          {form.formState.isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
        <p className="text-center text-sm text-muted-foreground" data-testid="login-forgot-hint">
          {t('auth.forgotHint')}
        </p>
      </form>
    </AuthLayout>
  );
}
