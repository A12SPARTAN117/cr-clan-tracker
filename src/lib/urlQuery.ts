'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * The page's query string for views whose state lives in the URL (a tab, a mode, an open row).
 * Next's useSearchParams makes a cached page render that whole view in the browser only, so the
 * page's HTML came without its content. This reads '' on the server and during hydration (the
 * default view renders into the HTML), then the real query, and updates when replaceUrl changes it.
 */
const EVENT = 'oa-url';

function subscribe(cb: () => void) {
  addEventListener('popstate', cb);
  addEventListener(EVENT, cb);
  return () => {
    removeEventListener('popstate', cb);
    removeEventListener(EVENT, cb);
  };
}

export function useUrlQuery(): URLSearchParams {
  const search = useSyncExternalStore(
    subscribe,
    () => location.search,
    () => '',
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** Replaces the URL without a navigation (the page already has what it shows) and updates useUrlQuery. */
export function replaceUrl(url: string | URL) {
  window.history.replaceState(null, '', url);
  dispatchEvent(new Event(EVENT));
}

/** Sets or (with null) removes query parameters on the current URL. */
export function setUrlQuery(patch: Record<string, string | null>) {
  const u = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v) u.searchParams.set(k, v);
    else u.searchParams.delete(k);
  }
  replaceUrl(u);
}
