import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { MailPlus, Power, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createUserSchema, inviteUserSchema, ROLES } from '@bareeq/shared';
import type { ProfileDto, Role } from '@bareeq/shared';

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
import { applyServerErrors } from '@/lib/forms';
import { useUrlFilters } from '@/lib/useUrlFilters';
import { useAuthStore } from '@/stores/auth.store';

import { useCreateUser, useInviteUser, useUpdateUser, useUsers } from './api';

type Input_ = z.input<typeof inviteUserSchema>;
type Output = z.output<typeof inviteUserSchema>;
const PAGE_SIZE = 20;
const FILTERS = ['search'] as const;
const isRole = (v: string): v is Role => (ROLES as readonly string[]).includes(v);

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { t } = useTranslation();
  const invite = useInviteUser();
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: '', fullName: '', role: 'staff' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await invite.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, ['email', 'fullName', 'role']);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('users.invite')}</DialogTitle>
          <DialogDescription>{t('users.inviteHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('users.fullName')} error={errors.fullName?.message} required>
            <Input autoComplete="off" {...form.register('fullName')} />
          </FormField>
          <FormField label={t('users.email')} error={errors.email?.message} required>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('users.sending') : t('users.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CreateInput = z.input<typeof createUserSchema>;
type CreateOutput = z.output<typeof createUserSchema>;

/** Creates an account with an initial password — works without e-mail (SMTP) set up. */
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
    defaultValues: { email: '', fullName: '', role: 'staff', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, ['email', 'fullName', 'role', 'password']);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('users.create')}</DialogTitle>
          <DialogDescription>{t('users.createHint')}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('users.fullName')} error={errors.fullName?.message} required>
            <Input autoComplete="off" {...form.register('fullName')} />
          </FormField>
          <FormField label={t('users.email')} error={errors.email?.message} required>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('users.createSubmit')}
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
  const { values, page, setFilters } = useUrlFilters(FILTERS);
  const users = useUsers({ ...values, page, pageSize: PAGE_SIZE });
  const update = useUpdateUser();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [toggling, setToggling] = useState<ProfileDto | null>(null);

  const columns = useMemo<ColumnDef<ProfileDto, unknown>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: t('users.fullName'),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.fullName}
            {row.original.id === myId ? (
              <span className="ms-2 text-xs text-muted-foreground">({t('users.you')})</span>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: t('users.email'),
        cell: ({ row }) => <span className="ltr-nums">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: t('users.role'),
        cell: ({ row }) => {
          const u = row.original;
          return (
            <NativeSelect
              aria-label={t('users.roleFor', { name: u.fullName })}
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
            <Button variant="ghost" size="sm" onClick={() => setToggling(row.original)}>
              <Power aria-hidden="true" />
              {row.original.isActive ? t('users.deactivate') : t('users.activate')}
            </Button>
          ),
      },
    ],
    [t, myId, update],
  );

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        actions={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <UserPlus aria-hidden="true" />
              {t('users.create')}
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <MailPlus aria-hidden="true" />
              {t('users.invite')}
            </Button>
          </>
        }
      />
      <div className="mb-4">
        <SearchInput
          label={t('users.search')}
          value={values.search}
          onChange={(search) => setFilters({ search })}
        />
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
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
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
    </>
  );
}
