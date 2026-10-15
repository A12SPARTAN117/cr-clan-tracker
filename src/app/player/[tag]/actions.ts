'use server';

import { updateTag } from 'next/cache';
import { tags } from '@/lib/cr/api';
import { allowRefresh } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/** Refresh button: drop the cached profile and battle log for this player. */
export async function refreshPlayer(tag: string) {
  if (typeof tag !== 'string') return;
  const c = checkTag(tag.slice(0, 20));
  if (c.kind !== 'valid' || !(await allowRefresh(tags.player(c.tag)))) return;
  updateTag(tags.player(c.tag));
}
