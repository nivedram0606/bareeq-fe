import { ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet, useLocation } from 'react-router';

import { hasRole } from '@bareeq/shared';
import type { Role } from '@bareeq/shared';

import { FullPageSpinner } from '@/components/States';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

export function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-xl font-semibold" data-testid="forbidden-heading">
        {t('common.forbiddenTitle')}
      </h1>
      <p className="text-sm text-muted-foreground" data-testid="forbidden-body">
        {t('common.forbiddenBody')}
      </p>
      <Button asChild variant="outline">
        <Link to="/" data-testid="forbidden-go-home">
          {t('common.goHome')}
        </Link>
      </Button>
    </div>
  );
}

/**
 * Requires a signed-in user (redirects to /login, remembering the target) and, optionally,
 * one of `roles`. Hiding UI is a convenience; the API enforces every permission.
 */
export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: readonly Role[];
  children?: ReactNode;
}) {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.profile?.role);
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }
  if (roles && !hasRole(role, roles)) return <ForbiddenPage />;
  return children ?? <Outlet />;
}

/** Wraps a route element so only `roles` can see it (inside the authenticated shell). */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const role = useAuthStore((s) => s.profile?.role);
  return hasRole(role, roles) ? children : <ForbiddenPage />;
}
