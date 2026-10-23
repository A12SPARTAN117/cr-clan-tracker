import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getPlayer, tags } from '@/lib/cr/api';
import { getRivals } from '@/lib/history/battles';
import { getPlayerProfile } from '@/lib/player/profile';
import type { Rivals } from '@/lib/player/rivals';

export type RivalsPage = { ok: true; name: string; tag: string; character: string | null; rivals: Rivals; logSize: number; at: number } | { ok: false; status: number };

/** The rivals page's data, cached per player for a minute so the page reads nothing per request. */
export async function rivalsPage(tag: string): Promise<RivalsPage> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await getPlayer(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return { ok: false, status: r.status };
  }
  const [p, rivals] = await Promise.all([getPlayerProfile(tag), getRivals(tag, 50)]);
  if (!p) {
    cacheLife('crError');
    return { ok: false, status: 0 };
  }
  cacheLife('crLive');
  return { ok: true, name: p.name, tag: p.tag, character: p.favourite?.render ?? null, rivals, logSize: p.battles.length, at: Date.parse(p.generatedAt) };
}
