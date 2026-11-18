import type { ReactElement, ReactNode } from 'react';
import { useId, cloneElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';

interface ControlProps {
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Label + control + (translated) error message, wired for accessibility. `error` is the i18n key
 * carried by the shared Zod schemas or the API's VALIDATION_ERROR details.
 */
export function FormField({
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactElement<ControlProps>;
}) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {t(error, { defaultValue: t('validation.invalid') })}
        </p>
      ) : null}
    </div>
  );
}
