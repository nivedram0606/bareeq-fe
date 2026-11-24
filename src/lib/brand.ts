/** Relative luminance (WCAG) of a `#rrggbb` colour. */
export function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** White or near-black text, whichever has the higher contrast on the brand colour. */
export function foregroundFor(hex: string): string {
  const l = luminance(hex);
  return contrast(l, 1) >= contrast(l, luminance('#0f172a')) ? '#ffffff' : '#0f172a';
}

/** localStorage key read by the inline script in index.html to paint the saved colour at once. */
export const BRAND_STORAGE_KEY = 'bareeq.brand';

/**
 * Applies the organization's brand colour to the CSS variables used by primary UI and to the
 * browser / phone status bar. It is remembered (unless `persist` is false, as in the live preview)
 * so the next visit starts in the school's colour instead of the default before the API answers.
 */
export function applyBrandColor(
  hex: string | null | undefined,
  { persist = true }: { persist?: boolean } = {},
): void {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const foreground = foregroundFor(hex);
  const root = document.documentElement.style;
  root.setProperty('--brand', hex);
  root.setProperty('--brand-foreground', foreground);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', hex));
  if (!persist) return;
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify({ hex, foreground }));
  } catch {
    // Storage can be unavailable (private mode); the colour still applies for this visit.
  }
}
