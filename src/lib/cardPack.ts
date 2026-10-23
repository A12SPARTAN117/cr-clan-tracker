import { cardArt, cardById } from './cards';

/**
 * Smaller page data for anything that carries many cards. A card object repeats its slug, name,
 * rarity, elixir and art URL, all of which the card table (already in the browser bundle) knows.
 * `packCards` walks a value on the server and leaves those fields out wherever they match the
 * table, marking the card with `$c` (its id); `unpackCards` puts them back in the browser before
 * anything renders. A player profile carries about 1,400 cards, so this is most of its payload.
 * Anything that doesn't match the table exactly is passed through unchanged.
 */

declare const packed: unique symbol;
/** A value with its cards packed; only `unpackCards` can read it. */
export type Packed<T> = { readonly [packed]: T };

type Obj = Record<string, unknown>;
/** Plain objects only: Dates, Maps and the like pass through as they are. */
const isObj = (v: unknown): v is Obj => {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

function packCard(o: Obj): Obj | null {
  if (typeof o.id !== 'number' || typeof o.slug !== 'string' || '$c' in o) return null;
  const info = cardById(o.id);
  if (!info || info.slug !== o.slug || info.name !== o.name || info.rarity !== o.rarity) return null;
  if ('elixir' in o && o.elixir !== info.elixir) return null;
  const out: Obj = { $c: o.id };
  for (const [k, v] of Object.entries(o)) {
    if (k === 'id' || k === 'slug' || k === 'name' || k === 'rarity') continue;
    if (k === 'elixir') {
      out.$e = 1; // had an elixir field (equal to the table's)
      continue;
    }
    if (k === 'img' && v === cardArt(info.slug, o.evo === true, o.hero === true)) {
      out.$i = 1; // had the card's own art
      continue;
    }
    out[k] = pack(v);
  }
  return out;
}

function pack(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(pack);
  if (!isObj(v)) return v;
  const card = packCard(v);
  if (card) return card;
  const out: Obj = {};
  for (const [k, x] of Object.entries(v)) out[k] = pack(x);
  return out;
}

function unpack(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(unpack);
  if (!isObj(v)) return v;
  if (typeof v.$c === 'number') {
    const info = cardById(v.$c);
    const { $c, $e, $i, ...rest } = v;
    const out: Obj = { id: $c, slug: info?.slug ?? String($c), name: info?.name ?? '', rarity: info?.rarity ?? 'common' };
    if ($e) out.elixir = info?.elixir ?? null;
    for (const [k, x] of Object.entries(rest)) out[k] = unpack(x);
    if ($i) out.img = cardArt(out.slug as string, out.evo === true, out.hero === true);
    return out;
  }
  const out: Obj = {};
  for (const [k, x] of Object.entries(v)) out[k] = unpack(x);
  return out;
}

export const packCards = <T>(v: T): Packed<T> => pack(v) as Packed<T>;
export const unpackCards = <T>(v: Packed<T>): T => unpack(v) as T;
