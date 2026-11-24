import type { ReactElement, ReactNode } from 'react';
import { useId, cloneElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import { useTestId } from '@/lib/testId';

interface ControlProps {
  name?: string;
  'data-testid'?: string;
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
  testId,
  children,
}: {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /** Overrides the test ID, which is otherwise `<scope>-<control name>`. */
  testId?: string;
  children: ReactElement<ControlProps>;
}) {
  const { t } = useTranslation();
  const tid = useTestId();
  const controlTestId =
    testId ??
    children.props['data-testid'] ??
    (children.props.name ? tid(children.props.name) : undefined);
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
        'data-testid': controlTestId,
      })}
      {hint ? (
        <p
          id={hintId}
          className="text-xs text-muted-foreground"
          data-testid={controlTestId && `${controlTestId}-hint`}
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-medium text-destructive"
          data-testid={controlTestId && `${controlTestId}-error`}
        >
          {t(error, { defaultValue: t('validation.invalid') })}
        </p>
      ) : null}
    </div>
  );
}
