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

describe('applyHistory war days', () => {
  // War day 3: days 1 and 2 are over. A has 4 today and 12 this week, so 8 before today.
  const member = { tag: 'A', name: 'PA', decks: 12, decksToday: 4, days: ['untracked', 'untracked', 4, 'pending'], inputs: {}, trophies: 0, isNew: false };
  const week = (wk: string, decks: number) => ({ key: wk, label: wk, decks, fame: 0, days: null });
  const d = (hist: unknown[] = []) =>
    ({ ...dash(['A']), war: { kind: 'war', day: 3 }, members: [{ ...member, hist }] }) as unknown as Dashboard;

  it("completes this week's finished days that snapshots caught early", () => {
    // The day-2 snapshot ran before the last 3 decks.
    const out = applyHistory(d(), hist({ dailyDecks: { '2026-10-15': { A: [4, 1, null, null] } } }));
    expect(out.members[0].days).toEqual([4, 4, 4, 'pending']);
  });

  it('fills a past week from the race log total', () => {
    const out = applyHistory(d([week('2026-10-08', 16), week('2026-10-01', 14)]), hist({ dailyDecks: { '2026-10-01': { A: [4, 4, 4, 1] } } }));
    expect(out.members[0].hist.map((w) => w?.days)).toEqual([
      [4, 4, 4, 4],
      [4, 4, 4, 2],
    ]);
  });
});
