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

/** Applies the organization's brand colour to the CSS variables used by primary UI. */
export function applyBrandColor(hex: string | null | undefined): void {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const root = document.documentElement.style;
  root.setProperty('--brand', hex);
  root.setProperty('--brand-foreground', foregroundFor(hex));
  // The browser / installed-app toolbar and the phone status bar use the theme colour too.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', hex));
}
