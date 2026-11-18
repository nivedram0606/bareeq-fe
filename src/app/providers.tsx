import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { Toaster } from '@/components/ui/sonner';
import i18n from '@/i18n';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';

export function Providers({ children }: { children: ReactNode }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
