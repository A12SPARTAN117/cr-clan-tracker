'use client';

import { useEffect, type DependencyList, type RefObject } from 'react';
import { fxLevel } from './budget';
import { effectsSwitchedOff } from './switches';

type Stop = (() => void) | null | undefined;

/** Runs `fn` once the browser is idle (or after `timeout` ms), so effects never compete with hydration. */
function whenIdle(fn: () => void, timeout = 1200): () => void {
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 200);
  return () => clearTimeout(id);
}

/**
 * Mounts a three.js scene into `host` without putting three.js in the page bundle: `load`
 * imports the scene module (its own chunk, fetched when the browser is idle), then `mount`
 * starts it. The host element is server-rendered, so the page layout never shifts. At the 'off'
 * effects level (Save-Data, or a device that couldn't keep up) the scene is never loaded, nor
 * while the effects kill switch is on (./switches).
 */
export function useLazyScene<M>(
  host: RefObject<HTMLElement | null>,
  load: () => Promise<M>,
  mount: (m: M, el: HTMLElement) => Stop,
  deps: DependencyList,
) {
  useEffect(() => {
    const el = host.current;
    if (!el || fxLevel() === 'off') return;
    let dead = false;
    let stop: Stop;
    const cancel = whenIdle(() => {
      effectsSwitchedOff()
        .then((off) => (off || dead ? null : load()))
        .then((m) => {
          if (m != null && !dead) stop = mount(m, el);
        })
        .catch(() => {}); // chunk failed to load: the page simply renders without the effect
    });
    return () => {
      dead = true;
      cancel();
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- callers pass the scene's inputs as `deps`
  }, deps);
}
