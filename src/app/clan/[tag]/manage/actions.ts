'use server';

import { updateTag } from 'next/cache';
import { tags } from '@/lib/cr/api';
import { checkTag } from '@/lib/tags';

/** Refresh button: drop the cached roster, river race and dashboard for this clan. */
export async function refreshClan(tag: string) {
  const c = checkTag(tag);
  if (c.kind !== 'valid') return;
  updateTag(tags.clan(c.tag));
}
