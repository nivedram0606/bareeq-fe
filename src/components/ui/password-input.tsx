import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

import { Input } from './input';

/**
 * Password field with a show/hide (eye) button. Props (including the `ref` from react-hook-form's
 * `register` and the id / test ID that `FormField` adds) go to the inner `<input>`; the button's
 * test ID is `<input test ID>-toggle`.
 */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const testId = (props as { 'data-testid'?: string })['data-testid'];
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn('pe-10', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
        aria-pressed={visible}
        aria-controls={props.id}
        disabled={props.disabled}
        data-testid={testId && `${testId}-toggle`}
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
