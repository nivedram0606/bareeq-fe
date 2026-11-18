import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

/** Search box that reports its value after the user pauses typing. */
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
        className="ps-9"
      />
    </div>
  );
}
