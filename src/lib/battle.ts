import type { Battle } from './cr/types';

/**
 * Who won a battle, from the `team` side: 1 win, -1 loss, 0 draw. Most battles go to the side with
 * more crowns (in 2v2 both teammates carry the team's count). War duels are best of three and go
 * to whoever won more rounds: a duel can end 3–3 on crowns and still be lost 1–2.
 */
export function outcome(b: Pick<Battle, 'team' | 'opponent'>): -1 | 0 | 1 {
  const us = b.team[0];
  const them = b.opponent[0];
  if (us?.rounds?.length && them?.rounds?.length) {
    let won = 0;
    us.rounds.forEach((r, i) => (won += Math.sign(r.crowns - (them.rounds![i]?.crowns ?? 0))));
    return Math.sign(won) as -1 | 0 | 1;
  }
  const crowns = (side: Battle['team']) => side.reduce((a, t) => Math.max(a, t.crowns), 0);
  return Math.sign(crowns(b.team) - crowns(b.opponent)) as -1 | 0 | 1;
}
