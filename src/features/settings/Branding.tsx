import { ImageUp } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LOGO_MAX_BYTES, LOGO_MIME_TYPES } from '@bareeq/shared';
import type { OrgDto } from '@bareeq/shared';

import { PageHeader } from '@/components/PageHeader';
import { ErrorState } from '@/components/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/misc';
import { applyBrandColor, foregroundFor } from '@/lib/brand';
import { toastError } from '@/lib/forms';
import { useUiStore } from '@/stores/ui.store';

import { schoolName, useOrg, useUpdateOrg, useUploadLogo } from './api';

const HEX = /^#[0-9a-fA-F]{6}$/;

function LogoCard({ org }: { org: OrgDto }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const upload = useUploadLogo();
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError('validation.logo_type');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError('validation.logo_size');
      return;
    }
    upload.mutate(file, { onError: toastError });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.logo')}</CardTitle>
        <CardDescription>{t('settings.logoHint')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={t('settings.logoAlt', { school: schoolName(org, locale) })}
              className="size-full object-contain"
            />
          ) : (
            <ImageUp className="size-8 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{t('settings.chooseLogo')}</Label>
          <Input
            id={inputId}
            type="file"
            accept={LOGO_MIME_TYPES.join(',')}
            disabled={upload.isPending}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {upload.isPending ? (
            <p className="text-sm text-muted-foreground">{t('settings.uploading')}</p>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {t(error)}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ColorCard({ org }: { org: OrgDto }) {
  const { t } = useTranslation();
  const update = useUpdateOrg();
  const [color, setColor] = useState(org.brandColor);
  const valid = HEX.test(color);

  // Live preview; reverted to the saved colour when leaving without saving.
  useEffect(() => {
    if (valid) applyBrandColor(color);
  }, [color, valid]);
  useEffect(() => () => applyBrandColor(org.brandColor), [org.brandColor]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.brandColor')}</CardTitle>
        <CardDescription>{t('settings.brandColorHint')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="brand-color-picker">{t('settings.pickColor')}</Label>
            <input
              id="brand-color-picker"
              type="color"
              value={valid ? color : org.brandColor}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded-md border border-input bg-card p-1"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="brand-color-hex">{t('settings.hexColor')}</Label>
            <Input
              id="brand-color-hex"
              dir="ltr"
              className="w-32"
              value={color}
              aria-invalid={!valid}
              onChange={(e) => setColor(e.target.value.trim())}
            />
          </div>
          <span
            className="rounded-md px-3 py-2 text-sm font-medium"
            style={valid ? { background: color, color: foregroundFor(color) } : undefined}
          >
            {t('settings.preview')}
          </span>
        </div>
        {!valid ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {t('validation.invalid_color')}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            disabled={!valid || update.isPending || color.toLowerCase() === org.brandColor}
            onClick={() => update.mutate({ brandColor: color }, { onError: toastError })}
          >
            {update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrandingPage() {
  const { t } = useTranslation();
  const org = useOrg();
  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <PageHeader
        title={t('settings.brandingTitle')}
        description={t('settings.brandingSubtitle')}
      />
      {org.isPending ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : org.isError ? (
        <ErrorState error={org.error} onRetry={() => void org.refetch()} />
      ) : (
        <>
          <LogoCard org={org.data} />
          <ColorCard org={org.data} />
        </>
      )}
    </div>
  );
}
