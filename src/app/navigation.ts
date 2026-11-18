import {
  BarChart3,
  Building2,
  CalendarRange,
  Download,
  GraduationCap,
  LayoutDashboard,
  Palette,
  School,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ADMIN_ONLY, ANY_ROLE, STAFF_OR_ADMIN } from '@bareeq/shared';
import type { Role } from '@bareeq/shared';

export interface NavItem {
  to: string;
  /** i18n key */
  label: string;
  icon: LucideIcon;
  roles: readonly Role[];
  end?: boolean;
}

export interface NavGroup {
  /** i18n key; omitted for the top group */
  label?: string;
  items: NavItem[];
}

/** Sidebar structure; items are filtered by the user's role (matches the route guards). */
export const NAVIGATION: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, roles: ANY_ROLE, end: true },
      { to: '/students', label: 'nav.students', icon: GraduationCap, roles: ANY_ROLE },
      { to: '/classes', label: 'nav.classes', icon: School, roles: STAFF_OR_ADMIN },
      { to: '/staff', label: 'nav.staff', icon: Users, roles: ANY_ROLE },
    ],
  },
  {
    label: 'nav.reports',
    items: [
      { to: '/reports/students', label: 'nav.reportStudents', icon: BarChart3, roles: ANY_ROLE },
      {
        to: '/reports/fee-collection',
        label: 'nav.reportCollection',
        icon: BarChart3,
        roles: ANY_ROLE,
      },
      {
        to: '/reports/outstanding',
        label: 'nav.reportOutstanding',
        icon: BarChart3,
        roles: ANY_ROLE,
      },
    ],
  },
  {
    label: 'nav.settings',
    items: [
      {
        to: '/settings/organization',
        label: 'nav.settingsOrganization',
        icon: Building2,
        roles: ADMIN_ONLY,
      },
      { to: '/settings/branding', label: 'nav.settingsBranding', icon: Palette, roles: ADMIN_ONLY },
      { to: '/settings/users', label: 'nav.settingsUsers', icon: UserCog, roles: ADMIN_ONLY },
      {
        to: '/settings/academic-years',
        label: 'nav.settingsYears',
        icon: CalendarRange,
        roles: ADMIN_ONLY,
      },
      { to: '/settings/export', label: 'nav.settingsExport', icon: Download, roles: ADMIN_ONLY },
    ],
  },
];
