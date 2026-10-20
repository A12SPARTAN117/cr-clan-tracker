/**
 * A tiny in-browser cache for API responses: each key is fetched at most once per `ttlMs`, and a
 * request already in flight is shared instead of repeated. Keeps the search box and the Home pins
 * from asking the server again for answers they got a moment ago (retyping, going back to Home).
 */
export function createClientCache<T>(ttlMs: number, max = 100) {
  const entries = new Map<string, { at: number; value: Promise<T> }>();
  return {
    get(key: string, load: () => Promise<T>, now = Date.now()): Promise<T> {
      const hit = entries.get(key);
      if (hit && now - hit.at < ttlMs) return hit.value;
      const value = load();
      entries.set(key, { at: now, value });
      // Failures aren't kept: the next call tries again.
      value.catch(() => entries.get(key)?.value === value && entries.delete(key));
      if (entries.size > max) entries.delete(entries.keys().next().value!);
      return value;
    },
    clear: () => entries.clear(),
    size: () => entries.size,
  };
}
