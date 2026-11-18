import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useUiStore } from '@/stores/ui.store';

/** Displays an OMR amount string ("125.500") as "OMR 125.500" / "١٢٥٫٥٠٠ ر.ع.". */
export function MoneyText({
  value,
  className,
  strike = false,
}: {
  value: string;
  className?: string;
  strike?: boolean;
}) {
  const locale = useUiStore((s) => s.locale);
  return (
    <span className={cn('whitespace-nowrap tabular-nums', strike && 'line-through', className)}>
      {formatMoney(value, locale)}
    </span>
  );
}
