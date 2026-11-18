import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { schoolName, useBranding } from '@/features/settings/api';
import { apiAssetUrl } from '@/lib/api';
import { applyBrandColor } from '@/lib/brand';
import { useUiStore } from '@/stores/ui.store';

/** Centered card with the school's logo and name, used by the public auth pages. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { data: branding, isPending } = useBranding();
  const locale = useUiStore((s) => s.locale);
  const localeChosen = useUiStore((s) => s.localeChosen);
  const setLocale = useUiStore((s) => s.setLocale);
  const name = branding ? schoolName(branding, locale) : t('app.name');

  useEffect(() => {
    if (!branding) return;
    applyBrandColor(branding.brandColor);
    if (!localeChosen && branding.defaultLocale !== locale) {
      setLocale(branding.defaultLocale, { chosen: false });
    }
  }, [branding, locale, localeChosen, setLocale]);

  useEffect(() => {
    document.title = `${title} · ${name}`;
  }, [title, name]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            {isPending ? (
              <Skeleton className="size-16 rounded-xl" />
            ) : branding?.logoUrl ? (
              <img
                src={apiAssetUrl(branding.logoUrl)}
                alt=""
                className="size-16 rounded-xl object-contain"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-16 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground"
              >
                {name.slice(0, 1)}
              </span>
            )}
            <p className="text-lg font-semibold" data-testid="school-name">
              {name}
            </p>
          </div>
          <Card>
            <CardHeader>
              <h1 className="text-xl leading-none font-semibold">{title}</h1>
              {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
