import { describe, expect, it } from 'vitest';

import { V } from '@bareeq/shared';

import ar from './ar.json';
import en from './en.json';

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

function leaf(tree: Tree, path: string): string | Tree | undefined {
  return path
    .split('.')
    .reduce<string | Tree | undefined>(
      (node, part) => (node && typeof node === 'object' ? node[part] : undefined),
      tree,
    );
}

describe('translations', () => {
  it('Arabic has exactly the same keys as English', () => {
    expect(keys(ar as Tree).sort()).toEqual(keys(en as Tree).sort());
  });

  it('no translation is empty', () => {
    const trees: [string, Tree][] = [
      ['en', en],
      ['ar', ar],
    ];
    for (const [name, tree] of trees) {
      for (const key of keys(tree)) {
        const value = leaf(tree, key);
        expect(typeof value === 'string' ? value.trim() : '', `${name}:${key}`).not.toBe('');
      }
    }
  });

  it('every shared validation message key is translated', () => {
    for (const key of Object.values(V)) {
      expect(typeof leaf(en as Tree, key), key).toBe('string');
      expect(typeof leaf(ar as Tree, key), key).toBe('string');
    }
  });
});
