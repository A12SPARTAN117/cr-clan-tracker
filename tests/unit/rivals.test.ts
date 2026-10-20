import { describe, expect, it } from 'vitest';
import type { Battle } from '@/lib/cr/types';
import { h2hGame, rivalsOf, type H2HGame } from '@/lib/player/rivals';

const side = (tag: string, crowns: number, rounds?: number[]) => ({ tag, name: tag.slice(1), crowns, cards: [], clan: { tag: '#C', name: 'Clan', badgeId: 1 }, rounds: rounds?.map((c) => ({ crowns: c })) });
const battle = (time: string, opp: string, us: number, them: number, x: Partial<Battle> = {}): Battle =>
  ({ type: 'pathOfLegend', battleTime: time, team: [side('#ME', us)], opponent: [side(opp, them)], ...x }) as unknown as Battle;
const g = (time: string, opp: string, result: -1 | 0 | 1, kind = 'ranked'): H2HGame => ({ time, oppTag: opp, oppName: opp, oppClan: null, kind, result, crowns: 0, oppCrowns: 0 });

describe('head-to-head games', () => {
  it('keeps 1v1 games with the result from the player’s side', () => {
    expect(h2hGame(battle('20261020T101500.000Z', '#AA', 2, 1), 'ranked')).toMatchObject({ oppTag: 'AA', result: 1, time: '2026-10-20T10:15:00.000Z', kind: 'ranked' });
  });

  it('leaves out 2v2 and boat battles', () => {
    expect(h2hGame(battle('20261020T101500.000Z', '#AA', 1, 0, { team: [side('#ME', 1), side('#MATE', 1)] } as Partial<Battle>), '2v2')).toBeNull();
    expect(h2hGame(battle('20261020T101500.000Z', '#AA', 0, 3, { type: 'boatBattle' } as Partial<Battle>), 'boat')).toBeNull();
  });

  it('decides war duels by rounds', () => {
    const duel = { ...battle('20261020T101500.000Z', '#AA', 3, 3), team: [side('#ME', 3, [0, 3, 0])], opponent: [side('#AA', 3, [1, 1, 1])] } as unknown as Battle;
    expect(h2hGame(duel, 'war')?.result).toBe(-1);
  });
});

describe('rivals', () => {
  const games = [
    g('2026-10-20T10:00:00.000Z', 'AA', 1),
    g('2026-10-19T10:00:00.000Z', 'AA', -1),
    g('2026-10-18T10:00:00.000Z', 'AA', 1, 'friendly'),
    g('2026-10-20T09:00:00.000Z', 'BB', 0),
    g('2026-10-17T09:00:00.000Z', 'BB', -1),
    g('2026-10-20T08:00:00.000Z', 'CC', 1),
  ];

  it('lists opponents met at least twice with their record, most games first', () => {
    const r = rivalsOf(games);
    expect(r.rivals.map((x) => [x.tag, x.games, x.wins, x.losses, x.draws])).toEqual([
      ['AA', 3, 2, 1, 0],
      ['BB', 2, 0, 1, 1],
    ]);
    expect(r.rivals[0].results).toEqual([1, -1, 1]);
    expect(r.rivals[0].kinds).toEqual(['ranked', 'friendly']);
    expect(r.rivals[0].lastMet).toBe('2026-10-20T10:00:00.000Z');
  });

  it('counts a game stored and still in the live log once', () => {
    const r = rivalsOf([...games, games[0], games[1]]);
    expect(r.games).toBe(6);
    expect(r.rivals[0].games).toBe(3);
    expect(r.since).toBe('2026-10-17T09:00:00.000Z');
    expect(r.opponents).toBe(3);
    expect(r.rivals[0].log.map((x) => x.result)).toEqual([1, -1, 1]);
  });
});
