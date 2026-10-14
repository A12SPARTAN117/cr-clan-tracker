import type { Battle } from './cr/types';
import { parseApiDate } from './format';
import { riverBattleKind } from './war';

/**
 * Game modes for the meta. Ranked, Ultimate Champion, Ladder, Clan War and 2v2 always exist;
 * live events and challenges (Spooky Chess, Draft…) are added from whatever the sampled battle
 * logs contain, so the filter follows what's in the game right now.
 */

export type ModeKind = 'ranked' | 'uc' | 'ladder' | 'war' | '2v2' | 'challenge' | 'draft' | 'chess' | 'event';
export type ModeInfo = { key: string; label: string; kind: ModeKind };

/** The top Path of Legends league in the live API ("Ultimate Champion"). */
export const UC_LEAGUE = 7;

export const CORE_MODES: ModeInfo[] = [
  { key: 'pol', label: 'Ranked', kind: 'ranked' },
  { key: 'uc', label: 'Ultimate Champion', kind: 'uc' },
  { key: 'ladder', label: 'Ladder', kind: 'ladder' },
  { key: 'war', label: 'Clan War', kind: 'war' },
  { key: '2v2', label: '2v2', kind: '2v2' },
];

/** Battle types that are never part of the public meta (custom / private games). */
const PRIVATE = new Set(['friendly', 'clanMate', 'tournament', 'boatBattle', 'casual1v1', 'casual2v2', 'unknown']);
const WAR = new Set(['riverRacePvP', 'riverRaceDuel', 'riverRaceDuelColosseum']);

const WORDS: Record<string, string> = { AllCards: 'All Cards', EventDeck: 'Event Deck', NoSet: '', TeamVsTeam: '2v2', Nx: '', '2x': '2x', '3x': '3x' };

/** "202610_Event_Spooky_Chess" → "Spooky Chess"; "Challenge_AllCards_EventDeck_NoSet" → "All Cards Challenge". */
export function humanizeMode(raw: string): string {
  const parts = raw
    .replace(/^\d{6}_/, '')
    .split('_')
    .filter((p) => p && !/^(Event|Friendly|Ladder|Competitive|NewArena|\d+)$/i.test(p))
    .map((p) => WORDS[p] ?? p.replace(/([a-z])([A-Z])/g, '$1 $2'))
    .filter(Boolean);
  const challenge = parts[0]?.toLowerCase() === 'challenge';
  const rest = (challenge ? parts.slice(1) : parts).filter((p) => p !== 'Event Deck');
  const name = rest.join(' ').replace(/\s+/g, ' ').trim() || 'Event';
  return challenge ? `${name} Challenge` : name;
}

function kindOf(label: string, raw: string): ModeKind {
  if (/chess/i.test(raw)) return 'chess';
  if (/draft/i.test(raw)) return 'draft';
  if (/challenge/i.test(raw) || /challenge/i.test(label)) return 'challenge';
  return 'event';
}

/** The meta modes a battle counts towards (a ranked Ultimate Champion battle counts for both). */
export function modesOfBattle(b: Pick<Battle, 'type' | 'gameMode' | 'leagueNumber' | 'team' | 'opponent' | 'battleTime'>): ModeInfo[] {
  const name = b.gameMode?.name ?? '';
  if (PRIVATE.has(b.type) || /friendly/i.test(name)) return [];
  if (b.type === 'pathOfLegend') return (b.leagueNumber ?? 0) >= UC_LEAGUE ? [CORE_MODES[0], CORE_MODES[1]] : [CORE_MODES[0]];
  // Training-day river race battles are practice, not war.
  if (WAR.has(b.type)) return riverBattleKind(b.type, parseApiDate(b.battleTime)) === 'war' ? [CORE_MODES[3]] : [];
  if (name === 'Ladder') return [CORE_MODES[2]];
  if (b.team.length === 2 && b.opponent.length === 2) return name === 'TeamVsTeam' ? [CORE_MODES[4]] : [];
  if (b.team.length !== 1 || b.opponent.length !== 1 || !b.gameMode?.id) return [];
  const label = humanizeMode(name);
  return [{ key: `ev${b.gameMode.id}`, label, kind: kindOf(label, name) }];
}
