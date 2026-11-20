import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { useStudent } from '@/features/students/api';
import { studentName } from '@/lib/display';
import { useUiStore } from '@/stores/ui.store';

import { NAVIGATION } from './navigation';

interface Crumb {
  label: string;
  /** Omitted for the current page and for section headings that have no page of their own. */
  to?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sidebar item for a path, with its section heading (e.g. Settings › Users). */
function navItemFor(path: string): { label: string; group?: string } | undefined {
  for (const group of NAVIGATION) {
    const item = group.items.find((i) => i.to === path);
    if (item) return { label: item.label, group: group.label };
  }
  return undefined;
}

/** The student's name for `/students/:id` pages (shares the page's cached query). */
function useStudentCrumb(id: string): string {
  const locale = useUiStore((s) => s.locale);
  const student = useStudent(id);
  return student.data ? studentName(student.data, locale) : '…';
}

function useCrumbs(): Crumb[] {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  const studentId = parts[0] === 'students' && UUID.test(parts[1] ?? '') ? (parts[1] ?? '') : '';
  const student = useStudentCrumb(studentId);

  if (parts.length === 0) return []; // dashboard
  const home: Crumb = { label: t('nav.dashboard'), to: '/' };

  if (parts[0] === 'students' && parts.length > 1) {
    const list: Crumb = { label: t('nav.students'), to: '/students' };
    if (parts[1] === 'new') return [home, list, { label: t('students.new') }];
    if (studentId && parts[2] === 'edit') {
      return [
        home,
        list,
        { label: student, to: `/students/${studentId}` },
        { label: t('common.edit') },
      ];
    }
    if (studentId) return [home, list, { label: student }];
  }

  if (pathname === '/account/password') return [home, { label: t('header.changePassword') }];

  const nav = navItemFor(`/${parts.join('/')}`);
  if (!nav) return [];
  return [home, ...(nav.group ? [{ label: t(nav.group) }] : []), { label: t(nav.label) }];
}

/** "Dashboard › Section › Page" trail above every inner page; hidden on the dashboard. */
export function Breadcrumbs() {
  const { t } = useTranslation();
  const crumbs = useCrumbs();
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label={t('nav.breadcrumb')} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${i}-${crumb.label}`}>
              {i > 0 ? (
                <li aria-hidden="true">
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </li>
              ) : null}
              <li className="min-w-0">
                {crumb.to && !last ? (
                  <Link
                    to={crumb.to}
                    className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {i === 0 ? <Home aria-hidden="true" className="size-3.5" /> : null}
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? 'page' : undefined}
                    className={last ? 'block max-w-64 truncate font-medium text-foreground' : ''}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
