import { afterEach, describe, expect, it, vi } from 'vitest';

describe('kill switches (lib/switches)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as { __crSwitches?: unknown }).__crSwitches;
  });

  it('reads SWITCHES_OFF when there is no database', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SWITCHES_OFF', ' effects , recaps,');
    const { isOff } = await import('@/lib/switches');
    expect(await isOff('effects')).toBe(true);
    expect(await isOff('recaps')).toBe(true);
    expect(await isOff('compare-clans')).toBe(false);
  });

  it('everything is on by default', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SWITCHES_OFF', '');
    const { switchesOff } = await import('@/lib/switches');
    expect([...(await switchesOff())]).toEqual([]);
  });

  it('the browser only hears about effects', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('SWITCHES_OFF', 'effects,compare-clans');
    const { GET } = await import('@/app/api/switches/route');
    const res = await GET(new Request('http://localhost/api/switches', { headers: { 'x-real-ip': '198.51.100.7' } }));
    expect(await res.json()).toEqual({ off: ['effects'] });
    expect(res.headers.get('cache-control')).toContain('s-maxage=30');
  });
});
