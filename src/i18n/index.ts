import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Locale } from '@bareeq/shared';

import { dirOf, useUiStore } from '@/stores/ui.store';

import ar from './ar.json';
import en from './en.json';

export const resources = { en: { translation: en }, ar: { translation: ar } } as const;

/** Sets <html lang/dir> and switches i18next. Called whenever the locale changes. */
function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = dirOf(locale);
  if (i18n.language !== locale) void i18n.changeLanguage(locale);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: useUiStore.getState().locale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes.
  returnNull: false,
});

applyLocale(useUiStore.getState().locale);
useUiStore.subscribe((state, prev) => {
  if (state.locale !== prev.locale) applyLocale(state.locale);
});

export default i18n;
