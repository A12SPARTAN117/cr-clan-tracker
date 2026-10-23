import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLimiter } from '@/lib/cr/limiter';
import { createClientCache } from '@/lib/clientCache';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('Clash Royale API gate (cr/limiter)', () => {
  afterEach(() => vi.useRealTimers());

  it('lets a burst start at once, then paces the rest at perSecond', () => {
    const t = 0;
    const lim = createLimiter({ perSecond: 10, burst: 5, now: () => t });
    const waits = Array.from({ length: 8 }, () => lim.reserve());
    // The first five go straight away; then one every 100 ms.
    expect(waits).toEqual([0, 0, 0, 0, 0, 100, 200, 300]);
    expect(lim.stats.delayed).toBe(3);
  });

  it('refills over time, never above the burst', () => {
    let t = 0;
    const lim = createLimiter({ perSecond: 10, burst: 3, now: () => t });
    [0, 1, 2].forEach(() => lim.reserve());
    t = 10_000; // a long quiet spell
    const waits = Array.from({ length: 5 }, () => lim.reserve());
    expect(waits).toEqual([0, 0, 0, 100, 200]);
  });

  it('never starts more than burst + perSecond × seconds calls', () => {
    const t = 0;
    const lim = createLimiter({ perSecond: 20, burst: 10, now: () => t });
    const starts = Array.from({ length: 200 }, () => t + lim.reserve());
    // In any one-second window at most burst + perSecond starts.
    for (let w = 0; w < 10_000; w += 250) expect(starts.filter((s) => s >= w && s < w + 1000).length).toBeLessThanOrEqual(30);
  });

  it('on a 429 pauses everyone for Retry-After, then retries once', async () => {
    vi.useFakeTimers();
    let t = 0;
    const lim = createLimiter({ perSecond: 100, burst: 10, now: () => t });
    const answers = [{ status: 429, retryAfter: 3 }, { status: 200 }];
    const call = vi.fn(async () => answers.shift()!);
    const first = lim.run(call);
    await vi.advanceTimersByTimeAsync(0);
    expect(call).toHaveBeenCalledTimes(1);
    // Any other caller is now held back until the pause ends too.
    expect(lim.reserve()).toBeGreaterThanOrEqual(3000);
    t = 3500;
    await vi.advanceTimersByTimeAsync(3500);
    expect((await first).status).toBe(200);
    expect(call).toHaveBeenCalledTimes(2);
    expect(lim.stats.throttled429).toBe(1);
  });

  it('gives up after one retry instead of looping on 429s', async () => {
    vi.useFakeTimers();
    let t = 0;
    const lim = createLimiter({ perSecond: 100, backoffMs: 500, now: () => t });
    const call = vi.fn(async () => ({ status: 429 }));
    const r = lim.run(call);
    await vi.advanceTimersByTimeAsync(0);
    t = 600;
    await vi.advanceTimersByTimeAsync(700);
    expect((await r).status).toBe(429);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('answers busy at once instead of queueing a visitor past maxWaitMs', async () => {
    let t = 0;
    const lim = createLimiter({ perSecond: 10, burst: 1, maxWaitMs: 1000, now: () => t });
    // Fill the queue 1.5 s deep.
    for (let i = 0; i < 16; i++) lim.reserve();
    const call = vi.fn(async () => ({ status: 200 }));
    const r = await lim.run(call, { onBusy: () => ({ status: 503 }) });
    expect(r.status).toBe(503);
    expect(call).not.toHaveBeenCalled();
    expect(lim.stats.shed).toBe(1);
    // Once the queue drains, calls go through again.
    t = 2000;
    expect((await lim.run(call, { onBusy: () => ({ status: 503 }) })).status).toBe(200);
  });

  it('holds background calls until the queue is short, and never sheds them', async () => {
    vi.useFakeTimers();
    let t = 0;
    const lim = createLimiter({ perSecond: 10, burst: 1, maxWaitMs: 500, now: () => t });
    for (let i = 0; i < 31; i++) lim.reserve(); // 3 s of visitors queued
    const call = vi.fn(async () => ({ status: 200 }));
    const p = lim.run(call, { background: true, onBusy: () => ({ status: 503 }) });
    await vi.advanceTimersByTimeAsync(1000);
    expect(call).not.toHaveBeenCalled();
    t = 2500; // the queue is now under a second deep
    await vi.advanceTimersByTimeAsync(2000);
    expect((await p).status).toBe(200);
    vi.useRealTimers();
  });

  it('waits only on its own timer, never on another call finishing (required inside "use cache")', async () => {
    const lim = createLimiter({ perSecond: 1000, burst: 2 });
    // A call that never finishes must not hold anyone else up.
    void lim.run(() => new Promise<{ status: number }>(() => {}));
    void lim.run(() => new Promise<{ status: number }>(() => {}));
    const r = await Promise.race([lim.run(async () => ({ status: 200 })), new Promise((res) => setTimeout(() => res('stuck'), 200))]);
    expect(r).toEqual({ status: 200 });
    await tick();
  });
});

describe('browser response cache (clientCache)', () => {
  it('shares one request between callers and reuses it within the TTL', async () => {
    const cache = createClientCache<number>(60_000);
    const load = vi.fn(async () => 42);
    const [a, b] = await Promise.all([cache.get('k', load, 0), cache.get('k', load, 10)]);
    expect([a, b]).toEqual([42, 42]);
    expect(await cache.get('k', load, 59_000)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('fetches again once the TTL has passed', async () => {
    const cache = createClientCache<number>(1000);
    const load = vi.fn(async () => 1);
    await cache.get('k', load, 0);
    await cache.get('k', load, 1500);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not keep failures', async () => {
    const cache = createClientCache<number>(60_000);
    await expect(cache.get('k', () => Promise.reject(new Error('down')), 0)).rejects.toThrow('down');
    await tick();
    expect(await cache.get('k', async () => 7, 1)).toBe(7);
  });

  it('stays bounded', async () => {
    const cache = createClientCache<number>(60_000, 3);
    for (let i = 0; i < 10; i++) await cache.get(`k${i}`, async () => i);
    expect(cache.size()).toBe(3);
  });
});
