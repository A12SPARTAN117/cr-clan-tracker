import { ModeIcon } from '@/components/ModeFilter';
import { ChallengeIcon, ClanWarIcon, FameIcon, MembersIcon } from '@/components/ui/icons';
import type { BattleKind } from '@/lib/player/profile';

export const KIND_LABEL: Record<BattleKind, string> = {
  ranked: 'Ranked',
  uc: 'Ranked · Ultimate Champion',
  ladder: 'Ladder',
  war: 'Clan War',
  '2v2': '2v2',
  challenge: 'Challenge',
  draft: 'Draft',
  chess: 'Event',
  event: 'Event',
  friendly: 'Friendly',
  boat: 'Boat battle',
  training: 'War training',
  tournament: 'Tournament',
};

/** The game-mode icon for a battle in the log. */
export function BattleKindIcon({ kind, size = 18 }: { kind: BattleKind; size?: number }) {
  if (kind === 'friendly') return <MembersIcon size={size} title="Friendly" />;
  if (kind === 'boat') return <FameIcon size={size} title="Boat battle" />;
  if (kind === 'training') return <ClanWarIcon size={size} title="War training" style={{ filter: 'grayscale(1)', opacity: 0.7 }} />;
  if (kind === 'tournament') return <ChallengeIcon size={size} title="Tournament" />;
  return <ModeIcon kind={kind} size={size} />;
}
