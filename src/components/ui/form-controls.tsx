import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const fieldBase =
  'w-full min-w-0 rounded-md border border-input bg-card px-3 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm';

/** Native <select>: accessible, keyboard friendly and works with react-hook-form `register`. */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select data-slot="select" className={cn(fieldBase, 'h-9 py-1 pe-8', className)} {...props} />
  );
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, 'min-h-20 py-2', className)}
      {...props}
    />
  );
}

export function Checkbox({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        'size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: ComponentProps<'span'> & {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:size-3',
        {
          default: 'border-transparent bg-primary text-primary-foreground',
          secondary: 'border-transparent bg-secondary text-secondary-foreground',
          success: 'border-success/30 bg-success/10 text-success',
          warning: 'border-warning/30 bg-warning/10 text-warning',
          destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
          outline: 'text-foreground',
        }[variant],
        className,
      )}
      {...props}
    />
  );
}
