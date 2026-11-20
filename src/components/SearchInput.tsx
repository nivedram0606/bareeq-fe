import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

/** Search box that reports its value after the user pauses typing, with a × to clear it. */
export function SearchInput({
  value,
  onChange,
  label,
  delay = 300,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  delay?: number;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // Adopt external changes (e.g. back/forward navigation) during render.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => onChange(draft.trim()), delay);
    return () => clearTimeout(timer);
  }, [draft, value, delay, onChange]);

  return (
    <div className="relative w-full sm:w-72">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        // Our own × replaces the browser's native one (Chrome/Safari only) for a consistent look.
        className="ps-9 pe-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft ? (
        <button
          type="button"
          aria-label={t('common.clearSearch')}
          title={t('common.clearSearch')}
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
