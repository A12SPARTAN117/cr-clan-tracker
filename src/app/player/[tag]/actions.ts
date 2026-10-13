'use server';

import { updateTag } from 'next/cache';
import { tags } from '@/lib/cr/api';
import { checkTag } from '@/lib/tags';

/** Refresh button: drop the cached profile and battle log for this player. */
export async function refreshPlayer(tag: string) {
  const c = checkTag(tag);
  if (c.kind !== 'valid') return;
  updateTag(tags.player(c.tag));
}
