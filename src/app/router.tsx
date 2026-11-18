import { createBrowserRouter } from 'react-router';

import { ADMIN_ONLY, STAFF_OR_ADMIN } from '@bareeq/shared';

import { FullPageSpinner } from '@/components/States';
import { LoginPage } from '@/features/auth/LoginPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorPage } from './RouteErrorPage';

/** Route-level code splitting: each page module is loaded on first visit. */
const page = <M,>(load: () => Promise<M>, pick: (m: M) => React.ComponentType) => ({
  lazy: async () => ({ Component: pick(await load()) }),
});

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <RouteErrorPage /> },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            // Errors inside a page keep the shell (sidebar/header) visible.
            errorElement: <RouteErrorPage />,
            children: [
              { index: true, element: <DashboardPage /> },
              {
                path: 'students',
                ...page(
                  () => import('@/features/students/StudentsListPage'),
                  (m) => m.StudentsListPage,
                ),
              },
              {
                path: 'students/:id',
                ...page(
                  () => import('@/features/students/StudentDetailPage'),
                  (m) => m.StudentDetailPage,
                ),
              },
              {
                path: 'staff',
                ...page(
                  () => import('@/features/staff/StaffPage'),
                  (m) => m.StaffPage,
                ),
              },
              {
                path: 'reports/students',
                ...page(
                  () => import('@/features/reports/StudentListingReportPage'),
                  (m) => m.StudentListingReportPage,
                ),
              },
              {
                path: 'reports/fee-collection',
                ...page(
                  () => import('@/features/reports/FeeCollectionReportPage'),
                  (m) => m.FeeCollectionReportPage,
                ),
              },
              {
                path: 'reports/outstanding',
                ...page(
                  () => import('@/features/reports/OutstandingReportPage'),
                  (m) => m.OutstandingReportPage,
                ),
              },
              {
                // staff+
                element: <ProtectedRoute roles={STAFF_OR_ADMIN} />,
                children: [
                  {
                    path: 'students/new',
                    ...page(
                      () => import('@/features/students/StudentForm'),
                      (m) => m.StudentFormPage,
                    ),
                  },
                  {
                    path: 'students/:id/edit',
                    ...page(
                      () => import('@/features/students/StudentForm'),
                      (m) => m.StudentFormPage,
                    ),
                  },
                  {
                    path: 'classes',
                    ...page(
                      () => import('@/features/classes/ClassesPage'),
                      (m) => m.ClassesPage,
                    ),
                  },
                ],
              },
              {
                // admin
                path: 'settings',
                element: <ProtectedRoute roles={ADMIN_ONLY} />,
                children: [
                  {
                    path: 'organization',
                    ...page(
                      () => import('@/features/settings/OrgSettings'),
                      (m) => m.OrgSettingsPage,
                    ),
                  },
                  {
                    path: 'branding',
                    ...page(
                      () => import('@/features/settings/Branding'),
                      (m) => m.BrandingPage,
                    ),
                  },
                  {
                    path: 'users',
                    ...page(
                      () => import('@/features/settings/Users'),
                      (m) => m.UsersPage,
                    ),
                  },
                  {
                    path: 'academic-years',
                    ...page(
                      () => import('@/features/settings/AcademicYears'),
                      (m) => m.AcademicYearsPage,
                    ),
                  },
                  {
                    path: 'export',
                    ...page(
                      () => import('@/features/settings/DataExport'),
                      (m) => m.DataExportPage,
                    ),
                  },
                ],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
