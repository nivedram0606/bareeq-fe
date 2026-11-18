import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LOCALES } from '@bareeq/shared';
import type { Locale } from '@bareeq/shared';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/stores/ui.store';

const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

/** Switches the UI language; sets <html lang/dir> via the i18n module. */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('header.language')}>
          <Languages aria-hidden="true" />
          <span>{t(`languages.${locale}`)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(v) => {
            if (isLocale(v)) setLocale(v);
          }}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l} lang={l}>
              {t(`languages.${l}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
