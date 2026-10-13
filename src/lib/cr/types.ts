// Shapes of the official Clash Royale API responses we use (verified against live data,
// see docs/api-findings.md). Only the fields the site reads are typed.

export type ApiRole = 'leader' | 'coLeader' | 'elder' | 'member';

export type IconUrls = { medium?: string; evolutionMedium?: string; heroMedium?: string; large?: string };

export type ApiCard = {
  name: string;
  id: number;
  level: number;
  starLevel?: number;
  /** 1 = evolved, 2 = hero, 3 = both (on a player's card: the unlocked state). */
  evolutionLevel?: number;
  maxLevel: number;
  maxEvolutionLevel?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'champion';
  count?: number;
  elixirCost?: number;
  iconUrls: IconUrls;
};

export type ApiSupportCard = { name: string; id: number; level: number; maxLevel: number; rarity: string; iconUrls: IconUrls };

export type ClanRef = { tag: string; name: string; badgeId: number };
export type Arena = { id: number; name: string; rawName?: string };

export type PolResult = { leagueNumber: number; trophies: number; rank: number | null };

export type ApiBadge = {
  name: string;
  level?: number;
  maxLevel?: number;
  progress?: number;
  target?: number;
  iconUrls: { large?: string };
};

export type ApiAchievement = { name: string; stars: number; value: number; target: number; info: string };

export type Player = {
  tag: string;
  name: string;
  expLevel: number;
  kingTowerLevel?: number;
  trophies: number;
  bestTrophies: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  challengeCardsWon: number;
  challengeMaxWins: number;
  tournamentCardsWon: number;
  tournamentBattleCount: number;
  currentWinLoseStreak?: number;
  role?: ApiRole;
  donations: number;
  donationsReceived: number;
  totalDonations: number;
  warDayWins: number;
  clanCardsCollected: number;
  clan?: ClanRef;
  arena?: Arena;
  badges: ApiBadge[];
  achievements: ApiAchievement[];
  cards: ApiCard[];
  supportCards?: ApiSupportCard[];
  currentDeck: ApiCard[];
  currentDeckSupportCards?: ApiSupportCard[];
  currentFavouriteCard?: { name: string; id: number; iconUrls: IconUrls; rarity: string; elixirCost?: number };
  starPoints?: number;
  expPoints?: number;
  totalExpPoints?: number;
  currentPathOfLegendSeasonResult?: PolResult;
  lastPathOfLegendSeasonResult?: PolResult;
  bestPathOfLegendSeasonResult?: PolResult;
};

export type BattleSide = {
  tag: string;
  name: string;
  startingTrophies?: number;
  trophyChange?: number;
  crowns: number;
  kingTowerHitPoints?: number;
  princessTowersHitPoints?: number[] | null;
  clan?: ClanRef;
  cards: ApiCard[];
  supportCards?: ApiSupportCard[];
  globalRank?: number | null;
  elixirLeaked?: number;
};

export type Battle = {
  type: string;
  battleTime: string;
  isLadderTournament?: boolean;
  arena?: Arena;
  gameMode: { id: number; name: string };
  deckSelection?: string;
  team: BattleSide[];
  opponent: BattleSide[];
  isHostedMatch?: boolean;
  leagueNumber?: number;
};

export type ClanMember = {
  tag: string;
  name: string;
  role: ApiRole;
  lastSeen: string;
  expLevel: number;
  trophies: number;
  arena?: Arena;
  clanRank: number;
  previousClanRank: number;
  donations: number;
  donationsReceived: number;
};

export type Location = { id: number; name: string; isCountry: boolean; countryCode?: string };

export type Clan = {
  tag: string;
  name: string;
  type: 'open' | 'inviteOnly' | 'closed';
  description: string;
  badgeId: number;
  clanScore: number;
  clanWarTrophies: number;
  location?: Location;
  requiredTrophies: number;
  donationsPerWeek: number;
  members: number;
  memberList: ClanMember[];
};

export type ClanSearchItem = Omit<Clan, 'memberList' | 'description'>;

export type RaceParticipant = {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
};

export type RaceClan = {
  tag: string;
  name: string;
  badgeId: number;
  fame: number;
  repairPoints: number;
  participants: RaceParticipant[];
  periodPoints?: number;
  clanScore: number;
  finishTime?: string;
};

export type CurrentRiverRace = {
  state: string;
  clan: RaceClan;
  clans: RaceClan[];
  sectionIndex: number;
  periodIndex: number;
  periodType: 'training' | 'warDay' | 'colosseum';
};

export type RiverRaceLogEntry = {
  seasonId: number;
  sectionIndex: number;
  createdDate: string;
  standings: { rank: number; trophyChange: number; clan: RaceClan }[];
};

export type PolRankedPlayer = { tag: string; name: string; expLevel: number; eloRating: number; rank: number; clan?: ClanRef };

export type ClanRanking = {
  tag: string;
  name: string;
  rank: number;
  previousRank: number;
  location?: Location;
  clanScore?: number;
  clanWarTrophies?: number;
  members: number;
  badgeId: number;
};

export type Paged<T> = { items: T[]; paging?: { cursors?: { after?: string; before?: string } } };
