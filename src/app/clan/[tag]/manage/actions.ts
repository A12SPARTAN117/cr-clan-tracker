'use server';

import { updateTag } from 'next/cache';
import { tags } from '@/lib/cr/api';
import { allowRefresh } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/** Refresh button: drop the cached roster, river race and dashboard for this clan. */
export async function refreshClan(tag: string) {
  if (typeof tag !== 'string') return;
  const c = checkTag(tag.slice(0, 20));
  if (c.kind !== 'valid' || !(await allowRefresh(tags.clan(c.tag)))) return;
  updateTag(tags.clan(c.tag));
}
