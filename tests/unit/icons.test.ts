import fs from 'node:fs';
import path from 'node:path';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as icons from '@/components/ui/icons';

/**
 * public/icons/<name>.svg are the drawings in components/ui/icons, which pages show as <img>.
 * This keeps the files in step with the code: run with UPDATE_ICONS=1 to rewrite them.
 */
const dir = path.resolve('public/icons');
const kebab = (n: string) => n.replace(/Icon$/, '').replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase();

/** The standalone file for one icon component, with React's generated ids made plain. */
function fileFor(C: FunctionComponent<{ size?: number }>): string {
  icons.setDrawInline(true);
  try {
    let svg = renderToStaticMarkup(createElement(C, { size: 24 }));
    const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    ids.forEach((id, i) => {
      svg = svg.split(`"${id}"`).join(`"g${i + 1}"`).split(`#${id})`).join(`#g${i + 1})`);
    });
    return svg + '\n';
  } finally {
    icons.setDrawInline(false);
  }
}

const drawn = Object.entries(icons).filter(([n, C]) => n.endsWith('Icon') && typeof C === 'function' && renderToStaticMarkup(createElement(C as FunctionComponent, {})).includes('/icons/'));

describe('icon files', () => {
  it('finds the drawn icons', () => {
    expect(drawn.length).toBeGreaterThan(20);
  });

  for (const [name, C] of drawn) {
    it(`${name} matches public/icons/${kebab(name)}.svg`, () => {
      const file = path.join(dir, `${kebab(name)}.svg`);
      const svg = fileFor(C as FunctionComponent<{ size?: number }>);
      if (process.env.UPDATE_ICONS) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, svg);
      }
      expect(fs.readFileSync(file, 'utf8')).toBe(svg);
      // The page asks for exactly this file.
      expect(renderToStaticMarkup(createElement(C as FunctionComponent, {}))).toContain(`/icons/${kebab(name)}.svg`);
    });
  }
});
