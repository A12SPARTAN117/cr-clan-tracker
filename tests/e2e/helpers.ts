import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

// Raw Clash Royale API access for comparing what the page shows with the source data.
const env: Record<string, string> = {};
const file = path.resolve(process.cwd(), '.env');
if (fs.existsSync(file))
  for (const l of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
export const HAS_KEY = !!(process.env.CR_API_KEY ?? env.CR_API_KEY);
export const CLAN = (process.env.TEST_CLAN ?? 'Q9YLY80P').replace('#', '');

export async function api<T>(p: string): Promise<T> {
  const base = process.env.CR_API_BASE ?? env.CR_API_BASE ?? 'https://proxy.royaleapi.dev/v1';
  const r = await fetch(base + p, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY ?? env.CR_API_KEY}` } });
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return (await r.json()) as T;
}
export const enc = (t: string) => encodeURIComponent(`#${t.replace('#', '')}`);
export const fmt = (n: number) => n.toLocaleString('en-US');

/** Collects console errors, ignoring third-party image noise. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|favicon|net::ERR/i.test(t)) return;
    errors.push(t);
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

/** The final (screen-reader) value of a Decode number inside `scope`. */
export const decoded = (page: Page, scope: string) => page.locator(scope).locator('.sr-only').first();

/** Visible pages only: Next keeps previous routes alive (hidden) in the DOM. */
export const visible = (page: Page, sel: string) => page.locator(`${sel}:visible`);

export async function noHorizontalScroll(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'page scrolls sideways').toBeLessThanOrEqual(1);
}
