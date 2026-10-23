'use client';

import { useEffect, useState } from 'react';
import type { EventRank } from './events';

/** One request per player per page visit, shared by every component that shows their ranks. */
const requests = new Map<string, Promise<EventRank[]>>();
const ranksOf = (tag: string) => {
  let r = requests.get(tag);
  if (!r) {
    r = fetch(`/api/ranks/${encodeURIComponent(tag)}`)
      .then((res) => (res.ok ? (res.json() as Promise<EventRank[]>) : []))
      .catch(() => []);
    requests.set(tag, r);
  }
  return r;
};

/**
 * A player's live event ranks, loaded in the browser after the page shows (null until then). The
 * pages that show them are cached and shared, so the ranks aren't part of their render.
 */
export function useEventRanks(tag: string): EventRank[] | null {
  const [got, setGot] = useState<{ tag: string; list: EventRank[] } | null>(null);
  useEffect(() => {
    let live = true;
    ranksOf(tag).then((list) => live && setGot({ tag, list }));
    return () => {
      live = false;
    };
  }, [tag]);
  return got?.tag === tag ? got.list : null;
}
