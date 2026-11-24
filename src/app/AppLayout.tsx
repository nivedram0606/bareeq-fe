import { KeyRound, LogOut, Menu, UserCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';

import { hasRole } from '@bareeq/shared';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/misc';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { schoolName, useOrg } from '@/features/settings/api';
import { apiAssetUrl } from '@/lib/api';
import { applyBrandColor } from '@/lib/brand';
import { displayName } from '@/lib/displayName';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';

import { Breadcrumbs } from './Breadcrumbs';
import { NAVIGATION } from './navigation';

function SchoolIdentity() {
  const { data: org, isPending } = useOrg();
  const locale = useUiStore((s) => s.locale);
  if (isPending) return <Skeleton className="h-8 w-40" />;
  if (!org) return null;
  const name = schoolName(org, locale);
  return (
    <div className="flex min-w-0 items-center gap-3">
      {org.logoUrl ? (
        <img
          src={apiAssetUrl(org.logoUrl)}
          alt=""
          className="size-9 shrink-0 rounded-md object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span className="truncate font-semibold" data-testid="school-name">
        {name}
      </span>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.profile?.role);
  return (
    <nav aria-label={t('nav.main')} className="flex flex-col gap-5 p-3">
      {NAVIGATION.map((group, gi) => {
        const items = group.items.filter((i) => hasRole(role, i.roles));
        if (items.length === 0) return null;
        return (
          <div key={group.label ?? gi} className="flex flex-col gap-1">
            {group.label ? (
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t(group.label)}
              </p>
            ) : null}
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                {t(item.label)}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  if (!profile) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={t('header.userMenu')}>
          <UserCircle aria-hidden="true" />
          <span className="hidden max-w-40 truncate sm:inline">
            {displayName(profile.fullName, t)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{displayName(profile.fullName, t)}</span>
          <span className="truncate text-xs font-normal text-muted-foreground" dir="ltr">
            {profile.username}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {t(`roles.${profile.role}`)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate('/account/password')}>
          <KeyRound aria-hidden="true" />
          {t('header.changePassword')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut aria-hidden="true" className="rtl:rotate-180" />
          {t('header.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Authenticated shell: responsive sidebar, branded header, language switch and user menu. */
export function AppLayout() {
  const { t } = useTranslation();
  const { data: org } = useOrg();
  const locale = useUiStore((s) => s.locale);
  const localeChosen = useUiStore((s) => s.localeChosen);
  const setLocale = useUiStore((s) => s.setLocale);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();

  useEffect(() => {
    if (!org) return;
    applyBrandColor(org.brandColor);
    document.title = schoolName(org, locale);
    if (!localeChosen && org.defaultLocale !== locale) {
      setLocale(org.defaultLocale, { chosen: false });
    }
  }, [org, locale, localeChosen, setLocale]);

  // Close the mobile drawer on navigation.
  useEffect(() => setSidebarOpen(false), [location.pathname, setSidebarOpen]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        {t('app.skipToContent')}
      </a>

      <aside className="fixed inset-y-0 start-0 hidden w-64 flex-col border-e bg-card lg:flex">
        <div className="flex h-16 items-center border-b px-4">
          <SchoolIdentity />
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent closeLabel={t('nav.close')}>
          <div className="flex h-16 items-center border-b px-4 pe-10">
            <SheetTitle asChild>
              <div>
                <SchoolIdentity />
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">{t('nav.main')}</SheetDescription>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t('nav.openMenu')}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>
          <div className="min-w-0 lg:hidden">
            <SchoolIdentity />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <LanguageSwitcher />
            <UserMenu />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-7xl p-4 outline-none md:p-6">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
