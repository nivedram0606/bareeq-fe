import { useRef } from 'react';

/**
 * Radix returns focus to a `*Trigger` on close; our dialogs are opened from state (row actions,
 * buttons outside a Trigger), so we remember what had focus when the content opened and restore
 * it when it closes (WCAG 2.4.3 focus order).
 */
export function useReturnFocus(handlers: {
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const previous = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: (event: Event) => {
      previous.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      handlers.onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: (event: Event) => {
      handlers.onCloseAutoFocus?.(event);
      if (event.defaultPrevented) return;
      const target = previous.current;
      if (target?.isConnected) {
        event.preventDefault();
        target.focus();
      }
    },
  };
}
