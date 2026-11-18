import { Pencil, Power } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';

import { STAFF_OR_ADMIN } from '@bareeq/shared';
import type { StudentDto } from '@bareeq/shared';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { RoleGate } from '@/components/RoleGate';
import { ErrorState } from '@/components/States';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { studentName } from '@/lib/display';
import { formatDate } from '@/lib/format';
import { toastError } from '@/lib/forms';
import { useUiStore } from '@/stores/ui.store';

import { useStudent, useUpdateStudent } from './api';
import { FeesTab } from './FeesTab';
import { GuardiansTab } from './GuardiansTab';

const TABS = ['profile', 'guardians', 'fees'] as const;
type Tab = (typeof TABS)[number];

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ProfileTab({ student }: { student: StudentDto }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  return (
    <Card>
      <CardContent>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label={t('students.admissionNo')}>
            <span className="ltr-nums">{student.admissionNo}</span>
          </Detail>
          <Detail label={t('students.firstName')}>{student.firstName}</Detail>
          <Detail label={t('students.lastName')}>{student.lastName}</Detail>
          <Detail label={t('students.nameAr')}>
            {student.nameAr ? <span lang="ar">{student.nameAr}</span> : '—'}
          </Detail>
          <Detail label={t('students.dob')}>{formatDate(student.dob, locale)}</Detail>
          <Detail label={t('students.gender')}>{t(`gender.${student.gender}`)}</Detail>
          <Detail label={t('students.class')}>{student.className ?? '—'}</Detail>
          <Detail label={t('students.status')}>
            <StatusBadge status={student.status} />
          </Detail>
          <Detail label={t('students.joinedOn')}>{formatDate(student.joinedOn, locale)}</Detail>
          <Detail label={t('students.primaryGuardian')}>
            {student.primaryGuardianName ?? '—'}
          </Detail>
          <Detail label={t('students.phone')}>
            {student.primaryGuardianPhone ? (
              <span className="ltr-nums">{student.primaryGuardianPhone}</span>
            ) : (
              '—'
            )}
          </Detail>
        </dl>
      </CardContent>
    </Card>
  );
}

function StatusToggle({ student }: { student: StudentDto }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const update = useUpdateStudent(student.id);
  const next = student.status === 'active' ? 'inactive' : 'active';
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Power aria-hidden="true" />
        {next === 'inactive' ? t('students.deactivate') : t('students.activate')}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={next === 'inactive' ? t('students.deactivateTitle') : t('students.activateTitle')}
        description={
          next === 'inactive' ? t('students.deactivateBody') : t('students.activateBody')
        }
        confirmLabel={next === 'inactive' ? t('students.deactivate') : t('students.activate')}
        destructive={next === 'inactive'}
        pending={update.isPending}
        onConfirm={() =>
          update.mutate({ status: next }, { onSuccess: () => setOpen(false), onError: toastError })
        }
      />
    </>
  );
}

export function StudentDetailPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'profile';
  const student = useStudent(id);
  const dir = useUiStore((st) => st.dir);

  if (student.isPending) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  if (student.isError) {
    return <ErrorState error={student.error} onRetry={() => void student.refetch()} />;
  }
  const s = student.data;

  return (
    <>
      <PageHeader
        title={studentName(s, locale)}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="ltr-nums">{s.admissionNo}</span>
            {s.className ? <span>· {s.className}</span> : null}
            <StatusBadge status={s.status} />
          </span>
        }
        actions={
          <RoleGate roles={STAFF_OR_ADMIN}>
            <StatusToggle student={s} />
            <Button asChild>
              <Link to={`/students/${s.id}/edit`}>
                <Pencil aria-hidden="true" />
                {t('common.edit')}
              </Link>
            </Button>
          </RoleGate>
        }
      />
      <Tabs
        value={tab}
        onValueChange={(v) => setParams(v === 'profile' ? {} : { tab: v }, { replace: true })}
        dir={dir}
      >
        <TabsList>
          <TabsTrigger value="profile">{t('students.tabProfile')}</TabsTrigger>
          <TabsTrigger value="guardians">{t('students.tabGuardians')}</TabsTrigger>
          <TabsTrigger value="fees">{t('students.tabFees')}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab student={s} />
        </TabsContent>
        <TabsContent value="guardians">
          <GuardiansTab studentId={s.id} />
        </TabsContent>
        <TabsContent value="fees">
          <FeesTab studentId={s.id} />
        </TabsContent>
      </Tabs>
    </>
  );
}
