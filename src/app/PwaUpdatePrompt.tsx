import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** How often an open app checks for a new version (it is often left open all day). */
const UPDATE_CHECK_MS = 60 * 60 * 1000;
const TOAST_ID = 'pwa-update';

/**
 * Registers the service worker and, when a new version has been deployed, offers a "Reload"
 * button instead of reloading on its own (which could discard a half-filled form).
 */
export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        if (navigator.onLine) void registration.update();
      }, UPDATE_CHECK_MS);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast(t('pwa.updateAvailable'), {
      id: TOAST_ID,
      duration: Infinity,
      action: { label: t('pwa.reload'), onClick: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, t, updateServiceWorker]);

  return null;
}
