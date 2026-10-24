import { describe, expect, it } from 'vitest';
import { humanizeMode, modesOfBattle, UC_LEAGUE } from '@/lib/modes';
import { finishDays, nextWarStart, riverBattleKind, warDay, warWeekKey } from '@/lib/war';
import { battle, cards, DECKS, MODES, side } from '../fixtures/battles';

const at = (iso: string) => new Date(iso);

describe('river race calendar', () => {
  // 14 Oct 2026 is a Wednesday. Days reset at 09:40 UTC.
  it('maps times to training and war days around the 09:40 reset', () => {
    expect(warDay(at('2026-10-14T07:00:00Z'))).toMatchObject({ kind: 'training', day: 2 });
    expect(warDay(at('2026-10-15T09:39:00Z'))).toMatchObject({ kind: 'training', day: 3 });
    expect(warDay(at('2026-10-15T09:41:00Z'))).toMatchObject({ kind: 'war', day: 1 });
    expect(warDay(at('2026-10-19T09:00:00Z'))).toMatchObject({ kind: 'war', day: 4 });
    expect(warDay(at('2026-10-19T10:00:00Z'))).toMatchObject({ kind: 'training', day: 1 });
    expect(warDay(at('2026-10-14T07:00:00Z')).nextReset.toISOString()).toBe('2026-10-14T09:40:00.000Z');
  });

  it('labels training days as part of the river race', () => {
    expect(warDay(at('2026-10-14T07:00:00Z')).label).toBe('River race · training day 2');
  });

  it('keys a race week by its Thursday', () => {
    expect(warWeekKey(at('2026-10-16T12:00:00Z'))).toBe('2026-10-15');
    // A race-log entry is created when the race ends on Monday's reset.
    expect(warWeekKey(at('2026-10-19T09:40:30Z'))).toBe('2026-10-15');
  });

  it('completes finished war days from the deck total', () => {
    // The last snapshot of day 2 ran before its last 2 decks: the total before today has them.
    expect(finishDays([4, 2], 2, 8)).toEqual([4, 4]);
    // One day without a snapshot is what the total leaves.
    expect(finishDays([null], 1, 3)).toEqual([3]);
    expect(finishDays([4, null, 1], 3, 9)).toEqual([4, 4, 1]);
    // Several missing days only when the total settles them.
    expect(finishDays([null, null, null, null], 4, 0)).toEqual([0, 0, 0, 0]);
    expect(finishDays([null, null, 3, null], 4, 15)).toEqual([4, 4, 3, 4]);
    expect(finishDays([null, null], 2, 5)).toEqual([null, null]);
    // Never lowers what a snapshot saw, never goes past 4 a day, ignores unfinished days.
    expect(finishDays([4, 3], 2, 6)).toEqual([4, 3]);
    expect(finishDays([2, 1], 2, 9)).toEqual([2, 4]);
    expect(finishDays([4, 1, 2, 'x' as never], 2, 8)).toEqual([4, 4, 2, 'x']);
    expect(finishDays([1, 1], 0, 8)).toEqual([1, 1]);
  });

  it('knows when war starts', () => {
    expect(nextWarStart(at('2026-10-14T07:00:00Z')).toISOString()).toBe('2026-10-15T09:40:00.000Z');
    expect(nextWarStart(at('2026-10-12T12:00:00Z')).toISOString()).toBe('2026-10-15T09:40:00.000Z');
    const during = at('2026-10-17T12:00:00Z');
    expect(nextWarStart(during)).toBe(during);
  });

  it('treats river race battles on training days as training, not war', () => {
    expect(riverBattleKind('riverRacePvP', at('2026-10-13T15:34:23Z'))).toBe('training');
    expect(riverBattleKind('riverRaceDuel', at('2026-10-13T15:26:15Z'))).toBe('training');
    expect(riverBattleKind('riverRacePvP', at('2026-10-16T12:00:00Z'))).toBe('war');
    expect(riverBattleKind('boatBattle', at('2026-10-17T12:00:00Z'))).toBe('war');
    expect(riverBattleKind('pathOfLegend', at('2026-10-16T12:00:00Z'))).toBeNull();
  });
});

describe('game modes', () => {
  const deck = cards(DECKS.hog);
  const one = (type: string, mode: { id: number; name: string }, when = '2026-10-16T12:00:00Z', extra = {}) =>
    modesOfBattle(battle(type, mode, at(when), [side('AAA', deck, 1)], [side('BBB', deck, 0)], extra)).map((m) => m.key);

  it('humanizes live game mode names', () => {
    expect(humanizeMode('202610_Event_Spooky_Chess')).toBe('Spooky Chess');
    expect(humanizeMode('Challenge_AllCards_EventDeck_NoSet')).toBe('All Cards Challenge');
    expect(humanizeMode('Draft_Competitive')).toBe('Draft');
    expect(humanizeMode('DoubleElixir')).toBe('Double Elixir');
  });

  it('puts ranked Ultimate Champion battles in both ranked modes', () => {
    expect(one('pathOfLegend', MODES.ranked, undefined, { leagueNumber: UC_LEAGUE })).toEqual(['pol', 'uc']);
    expect(one('pathOfLegend', MODES.ranked, undefined, { leagueNumber: 5 })).toEqual(['pol']);
  });

  it('finds ladder battles whatever their battle type', () => {
    expect(one('trail', MODES.ladder)).toEqual(['ladder']);
    expect(one('PvP', MODES.ladder)).toEqual(['ladder']);
  });

  it('counts war only on war days', () => {
    expect(one('riverRacePvP', MODES.war, '2026-10-16T12:00:00Z')).toEqual(['war']);
    expect(one('riverRacePvP', MODES.war, '2026-10-13T12:00:00Z')).toEqual([]);
  });

  it('keeps events and challenges, drops private games', () => {
    expect(one('trail', MODES.chess)).toEqual(['ev72000533']);
    expect(one('trail', MODES.challenge)).toEqual(['ev72000474']);
    expect(one('friendly', MODES.friendly)).toEqual([]);
    expect(one('clanMate', MODES.friendly)).toEqual([]);
    expect(one('tournament', { id: 72000065, name: 'Showdown_Friendly' })).toEqual([]);
    expect(one('boatBattle', { id: 72000266, name: 'ClanWar_BoatBattle' })).toEqual([]);
  });

  it('recognises 2v2', () => {
    const b = battle('trail', MODES.twoVtwo, at('2026-10-16T12:00:00Z'), [side('A', deck, 1), side('B', deck, 1)], [side('C', deck, 0), side('D', deck, 0)]);
    expect(modesOfBattle(b).map((m) => m.key)).toEqual(['2v2']);
  });
});
