import { describe, expect, it } from 'vitest';
import { applyHistory, pendingRoster, type Dashboard } from '@/lib/clan/dashboard';
import type { ClanHistory } from '@/lib/history';

/** Roster changes on the live roster that no snapshot has stored yet. */
const at = '2026-10-21T10:00:00.000Z';
const dash = (tags: string[]) => ({ generatedAt: at, members: tags.map((t) => ({ tag: t, name: `P${t}` })) }) as unknown as Dashboard;
const hist = (o: Partial<ClanHistory> = {}): ClanHistory => ({
  trackedSince: '2026-10-20T00:00:00.000Z',
  firstSeen: {},
  baseline: ['A', 'B'],
  names: { A: 'Alpha', B: 'Bravo' },
  rosterEvents: [],
  dailyDecks: {},
  trophiesWeekAgo: {},
  ...o,
});

describe('pendingRoster', () => {
  it('shows a member on the live roster but not in history as joined', () => {
    const r = pendingRoster(dash(['A', 'B', 'V']), hist());
    expect(r.joins).toEqual([{ at, tag: 'V', name: 'PV', kind: 'joined' }]);
    expect(r.leaves).toEqual([]);
  });

  it('shows a stored member missing from the live roster as left, by stored name', () => {
    const r = pendingRoster(dash(['A']), hist());
    expect(r.leaves).toEqual([{ at, tag: 'B', name: 'Bravo', kind: 'left' }]);
  });

  it('adds nothing once a snapshot has logged the change', () => {
    expect(pendingRoster(dash(['A', 'B', 'V']), hist({ firstSeen: { V: '2026-10-21T09:00:00.000Z' } })).joins).toEqual([]);
    // Logged after the cached roster was read: the log has it, the roster is just older.
    const left = hist({ baseline: ['A'], rosterEvents: [{ at: '2026-10-21T10:02:00.000Z', tag: 'B', name: 'Bravo', kind: 'left' }] });
    expect(pendingRoster(dash(['A', 'B']), left).joins).toEqual([]);
  });

  it("doesn't call someone who joined after the roster was read a leaver", () => {
    expect(pendingRoster(dash(['A', 'B']), hist({ firstSeen: { N: '2026-10-21T10:05:00.000Z' } })).leaves).toEqual([]);
  });

  it('applyHistory lists pending changes first and marks the joiner new', () => {
    const d = { ...dash(['A', 'B', 'V']), members: ['A', 'B', 'V'].map((t) => ({ tag: t, name: `P${t}`, days: [], hist: [], inputs: {}, trophies: 0, isNew: false })) } as unknown as Dashboard;
    const old = { at: '2026-10-20T12:00:00.000Z', tag: 'Z', name: 'Zed', kind: 'left' as const };
    const out = applyHistory(d, hist({ rosterEvents: [old] }));
    expect(out.history?.events.map((e) => e.tag)).toEqual(['V', 'Z']);
    const v = out.members.find((m) => m.tag === 'V')!;
    expect(v.joined).toBe(at);
    expect(v.isNew).toBe(true);
  });
});
