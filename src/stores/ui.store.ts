import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Locale } from '@bareeq/shared';

export type Dir = 'ltr' | 'rtl';

interface UiState {
  locale: Locale;
  dir: Dir;
  /** True once the user picked a language; until then the school's default locale applies. */
  localeChosen: boolean;
  sidebarOpen: boolean;
  setLocale: (locale: Locale, options?: { chosen?: boolean }) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const dirOf = (locale: Locale): Dir => (locale === 'ar' ? 'rtl' : 'ltr');

/** Client-only UI state. Only the language choice is persisted. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      locale: 'en',
      dir: 'ltr',
      localeChosen: false,
      sidebarOpen: false,
      setLocale: (locale, options) =>
        set((s) => ({
          locale,
          dir: dirOf(locale),
          localeChosen: options?.chosen === false ? s.localeChosen : true,
        })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'bareeq-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale, localeChosen: s.localeChosen }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<UiState, 'locale' | 'localeChosen'>>;
        const locale = p.locale === 'ar' || p.locale === 'en' ? p.locale : current.locale;
        return { ...current, locale, dir: dirOf(locale), localeChosen: Boolean(p.localeChosen) };
      },
    },
  ),
);
