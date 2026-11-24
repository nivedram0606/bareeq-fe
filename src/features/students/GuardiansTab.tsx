import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { createGuardianSchema, STAFF_OR_ADMIN } from '@bareeq/shared';
import type { GuardianDto } from '@bareeq/shared';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormField } from '@/components/FormField';
import { RoleGate } from '@/components/RoleGate';
import { EmptyState, ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge, Checkbox } from '@/components/ui/form-controls';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import { applyServerErrors, toastError, useResetOnOpen } from '@/lib/forms';
import { TestIdScope } from '@/lib/testId';

import { useCreateGuardian, useDeleteGuardian, useGuardians, useUpdateGuardian } from './api';

type Input_ = z.input<typeof createGuardianSchema>;
type Output = z.output<typeof createGuardianSchema>;
const FIELDS = ['name', 'relation', 'phone', 'email', 'isPrimary'] as const;

function GuardianDialog({
  studentId,
  guardian,
  open,
  onOpenChange,
}: {
  studentId: string;
  guardian: GuardianDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateGuardian(studentId);
  const update = useUpdateGuardian(studentId);
  const form = useForm<Input_, unknown, Output>({
    resolver: zodResolver(createGuardianSchema),
    values: {
      name: guardian?.name ?? '',
      relation: guardian?.relation ?? '',
      phone: guardian?.phone ?? '',
      email: guardian?.email ?? '',
      isPrimary: guardian?.isPrimary ?? false,
    },
  });
  const { errors, isSubmitting } = form.formState;
  useResetOnOpen(open, form.reset);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // The primary flag can only move to another guardian, never be cleared here.
      if (guardian) {
        await update.mutateAsync({
          id: guardian.id,
          body: { ...values, isPrimary: guardian.isPrimary || values.isPrimary },
        });
      } else await create.mutateAsync(values);
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, form.setError, FIELDS);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('common.close')} testId="guardian-form">
        <DialogHeader>
          <DialogTitle>{guardian ? t('guardians.edit') : t('guardians.add')}</DialogTitle>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void onSubmit(e)} className="grid gap-4">
          <FormField label={t('guardians.name')} error={errors.name?.message} required>
            <Input autoComplete="off" {...form.register('name')} />
          </FormField>
          <FormField label={t('guardians.relation')} error={errors.relation?.message} required>
            <Input autoComplete="off" {...form.register('relation')} />
          </FormField>
          <FormField label={t('guardians.phone')} error={errors.phone?.message}>
            <Input type="tel" dir="ltr" autoComplete="off" {...form.register('phone')} />
          </FormField>
          <FormField label={t('guardians.email')} error={errors.email?.message}>
            <Input type="email" dir="ltr" autoComplete="off" {...form.register('email')} />
          </FormField>
          {guardian?.isPrimary ? (
            <p className="text-sm text-muted-foreground" data-testid="guardian-form-primary-note">
              {t('guardians.isPrimaryNote')}
            </p>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox data-testid="guardian-form-isPrimary" {...form.register('isPrimary')} />
              {t('guardians.isPrimary')}
            </label>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="guardian-form-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="guardian-form-submit">
              {isSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GuardiansTab({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const guardians = useGuardians(studentId);
  const update = useUpdateGuardian(studentId);
  const remove = useDeleteGuardian(studentId);
  const [editing, setEditing] = useState<GuardianDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<GuardianDto | null>(null);

  const openDialog = (g: GuardianDto | null) => {
    setEditing(g);
    setDialogOpen(true);
  };

  let content;
  if (guardians.isPending) {
    content = <Skeleton className="h-32 rounded-xl" />;
  } else if (guardians.isError) {
    content = <ErrorState error={guardians.error} onRetry={() => void guardians.refetch()} />;
  } else if (guardians.data.length === 0) {
    content = <EmptyState message={t('guardians.empty')} />;
  } else {
    content = (
      <ul className="grid gap-3 md:grid-cols-2" data-testid="student-guardians-list">
        {guardians.data.map((g) => (
          <li key={g.id} data-testid={`student-guardians-${g.id}`}>
            <Card className="h-full gap-2 py-4">
              <CardContent className="grid gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" data-testid={`student-guardians-${g.id}-name`}>
                      {g.name}
                    </p>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid={`student-guardians-${g.id}-relation`}
                    >
                      {g.relation}
                    </p>
                  </div>
                  {g.isPrimary ? (
                    <Badge variant="success" data-testid={`student-guardians-${g.id}-primary`}>
                      <Star aria-hidden="true" />
                      {t('guardians.primary')}
                    </Badge>
                  ) : null}
                </div>
                <dl className="grid gap-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('guardians.phone')}:</dt>
                    <dd className="ltr-nums" data-testid={`student-guardians-${g.id}-phone`}>
                      {g.phone ?? '—'}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">{t('guardians.email')}:</dt>
                    <dd
                      className="ltr-nums break-all"
                      data-testid={`student-guardians-${g.id}-email`}
                    >
                      {g.email ?? '—'}
                    </dd>
                  </div>
                </dl>
                <RoleGate roles={STAFF_OR_ADMIN}>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(g)}
                      data-testid={`student-guardians-${g.id}-edit`}
                    >
                      <Pencil aria-hidden="true" />
                      {t('common.edit')}
                    </Button>
                    {!g.isPrimary ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={update.isPending}
                        data-testid={`student-guardians-${g.id}-make-primary`}
                        onClick={() =>
                          update.mutate(
                            { id: g.id, body: { isPrimary: true } },
                            { onError: toastError },
                          )
                        }
                      >
                        <Star aria-hidden="true" />
                        {t('guardians.makePrimary')}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(g)}
                      data-testid={`student-guardians-${g.id}-delete`}
                    >
                      <Trash2 aria-hidden="true" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </RoleGate>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <TestIdScope id="student-guardians">
      <div className="grid gap-4">
        <RoleGate roles={STAFF_OR_ADMIN}>
          <div className="flex justify-end">
            <Button onClick={() => openDialog(null)} data-testid="student-guardians-add">
              <Plus aria-hidden="true" />
              {t('guardians.add')}
            </Button>
          </div>
        </RoleGate>
        {content}
        <GuardianDialog
          studentId={studentId}
          guardian={editing}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
        <ConfirmDialog
          testId="guardian-delete-dialog"
          open={Boolean(deleting)}
          onOpenChange={(o) => !o && setDeleting(null)}
          title={t('guardians.deleteTitle')}
          description={t('guardians.deleteBody', { name: deleting?.name ?? '' })}
          confirmLabel={t('common.delete')}
          destructive
          pending={remove.isPending}
          onConfirm={() =>
            deleting &&
            remove.mutate(deleting.id, { onSuccess: () => setDeleting(null), onError: toastError })
          }
        />
      </div>
    </TestIdScope>
  );
}
