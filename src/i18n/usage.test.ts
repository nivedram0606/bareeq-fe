import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import ar from './ar.json';
import en from './en.json';

type Tree = { [key: string]: string | Tree };

const SRC = fileURLToPath(new URL('..', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

const has = (tree: Tree, key: string): boolean => {
  let node: string | Tree | undefined = tree;
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? node[part] : undefined;
  }
  return typeof node === 'string';
};

describe('translation usage', () => {
  /** Literal keys: t('a.b'), toastSuccess('a.b'), label: 'nav.x', and similar. */
  const used = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(
      /\b(?:t|toastSuccess|i18n\.t)\(\s*'([a-zA-Z_]+(?:\.[a-zA-Z_]+)+)'/g,
    )) {
      used.add(m[1] ?? '');
    }
    for (const m of text.matchAll(/label: '((?:nav)\.[a-zA-Z_]+)'/g)) used.add(m[1] ?? '');
  }

  it('finds the keys used in the source', () => {
    expect(used.size).toBeGreaterThan(100);
  });

  it('every literal key exists in English and Arabic', () => {
    const missing = [...used].filter((k) => !has(en as Tree, k) || !has(ar as Tree, k));
    expect(missing).toEqual([]);
  });
});
