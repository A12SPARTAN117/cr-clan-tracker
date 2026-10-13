// Clash Royale tags only ever use these 14 characters; a leading # is optional.
export const TAG_CHARS = '0289PYLQGRJCUV';

export function cleanTag(raw: string): string {
  return raw.trim().replace(/^#/, '').toUpperCase();
}

export type TagCheck =
  | { kind: 'empty' }
  | { kind: 'invalid'; bad: string }
  | { kind: 'short'; tag: string }
  | { kind: 'valid'; tag: string };

export function checkTag(raw: string): TagCheck {
  const tag = cleanTag(raw);
  if (!tag) return { kind: 'empty' };
  const bad = [...tag].find((c) => !TAG_CHARS.includes(c));
  if (bad) return { kind: 'invalid', bad };
  if (tag.length < 3) return { kind: 'short', tag };
  return { kind: 'valid', tag };
}

/** True when the text looks like a name search rather than a mistyped tag. */
export function looksLikeName(raw: string): boolean {
  const t = raw.trim();
  return t.length > 2 && !t.startsWith('#') && /[^0289PYLQGRJCUV]/i.test(t);
}

/** Where a search box should send the user. */
export function searchHref(raw: string): string | null {
  const c = checkTag(raw);
  if (c.kind === 'valid') return `/t/${c.tag}`;
  if (looksLikeName(raw)) return `/clans?q=${encodeURIComponent(raw.trim())}`;
  return null;
}
