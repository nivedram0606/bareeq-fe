import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { z } from 'zod';

import {
  academicYearSchema,
  brandingSchema,
  orgSchema,
  paginated,
  profileSchema,
} from '@bareeq/shared';
import type {
  BrandingDto,
  createAcademicYearSchema,
  createUserSchema,
  inviteUserSchema,
  Locale,
  OrgDto,
  updateAcademicYearSchema,
  updateOrgSchema,
  updateUserSchema,
} from '@bareeq/shared';

import { apiDownload, apiFetch } from '@/lib/api';
import type { QueryParams } from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/forms';
import { classKeys, invalidate, userKeys, yearKeys } from '@/lib/queryKeys';
import { ORG_QUERY_KEY } from '@/stores/auth.store';

export const orgKeys = {
  org: ORG_QUERY_KEY,
  branding: ['branding'] as const,
};

/* ---------------------------------------------------------- organization */

/** The signed-in user's organization (seeded from /me at sign-in). */
export function useOrg() {
  return useQuery({
    queryKey: orgKeys.org,
    queryFn: ({ signal }) => apiFetch('/org', { schema: orgSchema, signal }),
  });
}

/** Public branding for pages shown before sign-in. */
export function useBranding() {
  return useQuery({
    queryKey: orgKeys.branding,
    queryFn: ({ signal }) => apiFetch('/branding', { schema: brandingSchema, signal }),
    staleTime: 5 * 60_000,
  });
}

/** School name in the current language (Arabic name falls back to the English one). */
export const schoolName = (org: Pick<OrgDto | BrandingDto, 'name' | 'nameAr'>, locale: Locale) =>
  locale === 'ar' && org.nameAr ? org.nameAr : org.name;

function useOrgSaved() {
  const qc = useQueryClient();
  return (org: OrgDto) => {
    qc.setQueryData(orgKeys.org, org);
    invalidate(qc, orgKeys.branding);
  };
}

export function useUpdateOrg() {
  const saved = useOrgSaved();
  return useMutation({
    mutationFn: (body: z.output<typeof updateOrgSchema>) =>
      apiFetch('/org', { method: 'PATCH', body, schema: orgSchema }),
    onSuccess: (org) => {
      saved(org);
      toastSuccess('settings.saved');
    },
  });
}

export function useUploadLogo() {
  const saved = useOrgSaved();
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('logo', file);
      return apiFetch('/org/logo', { method: 'POST', body, schema: orgSchema });
    },
    onSuccess: (org) => {
      saved(org);
      toastSuccess('settings.logoUploaded');
    },
  });
}

/* ----------------------------------------------------------------- users */

export function useUsers(q: QueryParams) {
  return useQuery({
    queryKey: userKeys.list(q),
    queryFn: ({ signal }) =>
      apiFetch('/users', { query: q, schema: paginated(profileSchema), signal }),
    placeholderData: keepPreviousData,
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof inviteUserSchema>) =>
      apiFetch('/users/invite', { method: 'POST', body, schema: profileSchema }),
    onSuccess: () => {
      invalidate(qc, userKeys.all);
      toastSuccess('users.invited');
    },
  });
}

/** Creates an account with an initial password (no e-mail needed). */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createUserSchema>) =>
      apiFetch('/users', { method: 'POST', body, schema: profileSchema }),
    onSuccess: () => {
      invalidate(qc, userKeys.all);
      toastSuccess('users.created');
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateUserSchema> }) =>
      apiFetch(`/users/${id}`, { method: 'PATCH', body, schema: profileSchema }),
    onSuccess: () => {
      invalidate(qc, userKeys.all);
      toastSuccess('users.updated');
    },
    onError: toastError,
  });
}

/* -------------------------------------------------------- academic years */

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: z.output<typeof createAcademicYearSchema>) =>
      apiFetch('/academic-years', { method: 'POST', body, schema: academicYearSchema }),
    onSuccess: () => {
      invalidate(qc, yearKeys.all, classKeys.all);
      toastSuccess('years.created');
    },
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: z.output<typeof updateAcademicYearSchema> }) =>
      apiFetch(`/academic-years/${id}`, { method: 'PATCH', body, schema: academicYearSchema }),
    onSuccess: () => {
      invalidate(qc, yearKeys.all, classKeys.all);
      toastSuccess('years.updated');
    },
    onError: toastError,
  });
}

/* ---------------------------------------------------------------- export */

export function useDataExport() {
  return useMutation({
    mutationFn: () => apiDownload('/export'),
    onSuccess: () => toastSuccess('export.done'),
    onError: toastError,
  });
}
