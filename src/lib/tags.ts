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

/** Text that can only be a tag: valid tag characters and either a leading # or a digit. */
export function surelyTag(raw: string): boolean {
  const t = raw.trim();
  return checkTag(t).kind === 'valid' && (t.startsWith('#') || /\d/.test(t));
}

/** Where a search box should send the user: straight to a tag, or to the search results. */
export function searchHref(raw: string): string | null {
  const t = raw.trim();
  const c = checkTag(t);
  if (surelyTag(t) && c.kind === 'valid') return `/t/${c.tag}`;
  if (t.startsWith('#') && c.kind === 'invalid') return null; // a mistyped tag
  if (t.replace(/^#/, '').length >= 2) return `/search?q=${encodeURIComponent(t)}`;
  return null;
}
