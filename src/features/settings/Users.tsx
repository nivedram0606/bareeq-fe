import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Power, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createUserSchema, resetUserPasswordSchema, ROLES } from '@bareeq/shared';
import type { ProfileDto, Role } from '@bareeq/shared';

import { ClearFiltersButton } from '@/components/ClearFiltersButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DataTable } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge, NativeSelect } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { displayName } from '@/lib/displayName';
import { applyServerErrors } from '@/lib/forms';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { TestIdScope } from '@/lib/testId';
import { useAuthStore } from '@/stores/auth.store';

import { useCreateUser, useResetUserPassword, useUpdateUser, useUsers } from './api';

const PAGE_SIZE = 20;
const FILTERS = ['search'] as const;
const isRole = (v: string): v is Role => (ROLES as readonly string[]).includes(v);

type CreateInput = z.input<typeof createUserSchema>;
type CreateOutput = z.output<typeof createUserSchema>;

/** Creates an account with a username and an initial password. */
function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateUser();
  const form = useForm<CreateInput, unknown, CreateOutput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', fullName: '', email: '', role: 'staff', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, ['username', 'email', 'fullName', 'role', 'password']);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')} testId="user-form">
        <DialogHeader>
          <DialogTitle>{t('users.create')}</DialogTitle>
          <DialogDescription>{t('users.createHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('users.fullName')} error={errors.fullName?.message} required>
            <Input autoComplete="off" {...form.register('fullName')} />
          </FormField>
          <FormField
            label={t('users.username')}
            error={errors.username?.message}
            hint={t('users.usernameHint')}
            required
          >
            <Input
              dir="ltr"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              {...form.register('username')}
            />
          </FormField>
          <FormField label={t('users.email')} error={errors.email?.message}>
            <Input type="email" dir="ltr" autoComplete="off" {...form.register('email')} />
          </FormField>
          <FormField label={t('users.role')} error={errors.role?.message} required>
            <NativeSelect {...form.register('role')}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField
            label={t('users.initialPassword')}
            error={errors.password?.message}
            hint={t('users.initialPasswordHint')}
            required
          >
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="user-form-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button data-testid="user-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('users.createSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ResetInput = z.input<typeof resetUserPasswordSchema>;
type ResetOutput = z.output<typeof resetUserPasswordSchema>;

/** Admin sets a new password for someone who forgot theirs. */
function ResetPasswordDialog({ user, onClose }: { user: ProfileDto | null; onClose: () => void }) {
  const { t } = useTranslation();
  const reset = useResetUserPassword();
  const form = useForm<ResetInput, unknown, ResetOutput>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: { password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const close = () => {
    form.reset();
    onClose();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await reset.mutateAsync({ id: user.id, body: values });
      close();
    } catch (err) {
      applyServerErrors(err, form.setError, ['password']);
    }
  });

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && close()}>
      <DialogContent closeLabel={t('common.close')} testId="reset-password-form">
        <DialogHeader>
          <DialogTitle>{t('users.resetPasswordTitle', { name: user?.fullName ?? '' })}</DialogTitle>
          <DialogDescription>{t('users.resetPasswordHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField
            label={t('auth.newPassword')}
            error={errors.password?.message}
            hint={t('users.initialPasswordHint')}
            required
          >
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={close} data-testid="reset-password-form-cancel">
              {t('common.cancel')}
            </Button>
            <Button data-testid="reset-password-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('users.resetPassword')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const { t } = useTranslation();
  const myId = useAuthStore((s) => s.profile?.id);
  const { values, page, setFilters, isFiltered, clearFilters } = useUrlFilters(FILTERS);
  const users = useUsers({ ...values, page, pageSize: PAGE_SIZE });
  const update = useUpdateUser();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetting, setResetting] = useState<ProfileDto | null>(null);
  const [toggling, setToggling] = useState<ProfileDto | null>(null);

  const columns = useMemo<ColumnDef<ProfileDto, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: t('users.fullName'),
        cell: ({ row }) => (
          <span className="font-medium">
            {displayName(row.original.fullName, t)}
            {row.original.id === myId ? (
              <span
                className="ms-2 text-xs text-muted-foreground"
                data-testid={`users-row-${row.original.id}-you`}
              >
                ({t('users.you')})
              </span>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: 'username',
        header: t('users.username'),
        cell: ({ row }) => (
          <span className="ltr-nums" dir="ltr">
            {row.original.username}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: t('users.email'),
        cell: ({ row }) => (
          <span className="ltr-nums text-muted-foreground">{row.original.email ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: t('users.role'),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <NativeSelect
              aria-label={t('users.roleFor', { name: u.fullName })}
              data-testid={`users-row-${u.id}-role-select`}
              className="w-40"
              value={u.role}
              disabled={u.id === myId || update.isPending}
              onChange={(e) => {
                if (isRole(e.target.value))
                  update.mutate({ id: u.id, body: { role: e.target.value } });
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </NativeSelect>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: t('users.status'),
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">{t('status.active')}</Badge>
          ) : (
            <Badge variant="secondary">{t('status.inactive')}</Badge>
          ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('common.actions')}</span>,
        meta: { className: 'text-end' },
        cell: ({ row }) =>
          row.original.id === myId ? null : (
            <div className="flex justify-end gap-1">
              {/* Icon-only below desktop width so the row fits; the label stays for screen readers. */}
              <Button
                variant="ghost"
                size="sm"
                title={t('users.resetPassword')}
                onClick={() => setResetting(row.original)}
                data-testid={`users-row-${row.original.id}-reset-password`}
              >
                <KeyRound aria-hidden="true" />
                <span className="max-lg:sr-only">{t('users.resetPassword')}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title={row.original.isActive ? t('users.deactivate') : t('users.activate')}
                onClick={() => setToggling(row.original)}
                data-testid={`users-row-${row.original.id}-toggle-active`}
              >
                <Power aria-hidden="true" />
                <span className="max-lg:sr-only">
                  {row.original.isActive ? t('users.deactivate') : t('users.activate')}
                </span>
              </Button>
            </div>
          ),
      },
    ],
    [t, myId, update],
  );

  return (
    <TestIdScope id="users">
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <Button onClick={() => setCreateOpen(true)} data-testid="users-new">
            <UserPlus aria-hidden="true" />
            {t('users.create')}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          label={t('users.search')}
          value={values.search}
          onChange={(search) => setFilters({ search })}
        />
        <ClearFiltersButton active={isFiltered} onClear={clearFilters} />
      </div>
      <DataTable
        caption={t('users.title')}
        columns={columns}
        data={users.data?.data}
        isPending={users.isPending}
        isError={users.isError}
        error={users.error}
        onRetry={() => void users.refetch()}
        emptyMessage={t('users.empty')}
        getRowId={(u) => u.id}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: users.data?.total ?? 0,
          onPageChange: (p) => setFilters({ page: p }),
        }}
      />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        testId="user-status-dialog"
        open={Boolean(toggling)}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.isActive ? t('users.deactivateTitle') : t('users.activateTitle')}
        description={
          toggling?.isActive
            ? t('users.deactivateBody', { name: toggling.fullName })
            : t('users.activateBody', { name: toggling?.fullName ?? '' })
        }
        confirmLabel={toggling?.isActive ? t('users.deactivate') : t('users.activate')}
        destructive={toggling?.isActive}
        pending={update.isPending}
        onConfirm={() =>
          toggling &&
          update.mutate(
            { id: toggling.id, body: { isActive: !toggling.isActive } },
            { onSuccess: () => setToggling(null) },
          )
        }
      />
    </TestIdScope>
  );
}
