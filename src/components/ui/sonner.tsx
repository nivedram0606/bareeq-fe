import { Toaster as Sonner } from 'sonner';

import { useUiStore } from '@/stores/ui.store';

/** Toast host; positioned at the inline-end edge and mirrored for RTL. */
export function Toaster() {
  const dir = useUiStore((s) => s.dir);
  return (
    <Sonner
      dir={dir}
      position={dir === 'rtl' ? 'top-left' : 'top-right'}
      richColors
      closeButton
      toastOptions={{ classNames: { toast: 'font-sans' } }}
    />
  );
}
