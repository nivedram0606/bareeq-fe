import { Banknote, GraduationCap, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { MoneyText } from '@/components/MoneyText';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState } from '@/components/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { schoolName, useOrg } from '@/features/settings/api';
import { formatDate, formatNumber } from '@/lib/format';
import { TestIdScope } from '@/lib/testId';
import { useUiStore } from '@/stores/ui.store';

import { useDashboard } from './api';

function Kpi({
  label,
  icon: Icon,
  testId,
  children,
}: {
  label: string;
  icon: LucideIcon;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-2" data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold" data-testid={`${testId}-value`}>
          {children}
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { data: org } = useOrg();
  const { data, isPending, isError, error, refetch } = useDashboard();

  return (
    <TestIdScope id="dashboard">
      <PageHeader
        title={t('dashboard.title')}
        description={org ? t('dashboard.subtitle', { school: schoolName(org, locale) }) : undefined}
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            {isPending ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              <>
                <Kpi
                  label={t('dashboard.activeStudents')}
                  icon={GraduationCap}
                  testId="dashboard-kpi-active-students"
                >
                  {formatNumber(data.activeStudents, locale)}
                </Kpi>
                <Kpi
                  label={t('dashboard.collectedThisMonth')}
                  icon={Banknote}
                  testId="dashboard-kpi-collected-this-month"
                >
                  <MoneyText value={data.collectedThisMonth} />
                </Kpi>
                <Kpi
                  label={t('dashboard.totalOutstanding')}
                  icon={Wallet}
                  testId="dashboard-kpi-total-outstanding"
                >
                  <MoneyText value={data.totalOutstanding} />
                </Kpi>
              </>
            )}
          </div>

          <Card data-testid="dashboard-recent-payments">
            <CardHeader>
              <CardTitle>{t('dashboard.recentPayments')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : data.recentPayments.length === 0 ? (
                <EmptyState message={t('dashboard.noPayments')} />
              ) : (
                <Table data-testid="dashboard-recent-payments-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dashboard.date')}</TableHead>
                      <TableHead>{t('dashboard.student')}</TableHead>
                      <TableHead>{t('dashboard.fee')}</TableHead>
                      <TableHead>{t('dashboard.method')}</TableHead>
                      <TableHead className="text-end">{t('dashboard.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentPayments.map((p) => (
                      <TableRow
                        key={p.id}
                        className={p.voidedAt ? 'text-muted-foreground' : ''}
                        data-testid={`dashboard-payment-row-${p.id}`}
                      >
                        <TableCell className="whitespace-nowrap">
                          {formatDate(p.paidOn, locale)}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/students/${p.studentId}`}
                            data-testid={`dashboard-payment-row-${p.id}-student`}
                            className="font-medium text-primary hover:underline"
                          >
                            {p.studentName}
                          </Link>
                        </TableCell>
                        <TableCell>{p.feeTitle}</TableCell>
                        <TableCell>{t(`payMethods.${p.method}`)}</TableCell>
                        <TableCell className="text-end">
                          <MoneyText value={p.amount} strike={Boolean(p.voidedAt)} />
                          {p.voidedAt ? (
                            <span className="ms-2 text-xs">({t('common.voided')})</span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </TestIdScope>
  );
}
