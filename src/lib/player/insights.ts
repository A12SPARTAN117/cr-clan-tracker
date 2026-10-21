import { cardById } from '../cards';
import type { H2HGame } from './rivals';

/**
 * What a player's stored 1v1 games say about how they play: elixir and close games, playstyle,
 * tilt and site achievements. Pure functions over games (newest first), so they're testable and
 * run the same on server and client. Every number says how many games it's based on.
 */

/** Hit points left on a side's surviving towers ("" or null → none / unknown). */
export function towersHp(s: string | null | undefined): number[] | null {
  if (s == null) return null;
  return s ? s.split(',').map(Number) : [];
}

/** A side's weakest surviving tower, or null when we don't know. */
const weakest = (s: string | null | undefined) => {
  const t = towersHp(s);
  return t && t.length ? Math.min(...t) : t ? 0 : null;
};

/** How few hit points the winner's weakest tower had to keep for a game to count as close. */
export const CLOSE_HP = 600;

/**
 * Close: decided by one crown, or the winner was left with a tower on a few hundred hit points.
 * Blowout: two crowns or more apart (and not close by hit points). Draws are close.
 */
export function closeness(g: H2HGame): 'close' | 'blowout' {
  if (g.result === 0) return 'close';
  const diff = Math.abs(g.crowns - g.oppCrowns);
  if (diff <= 1) return 'close';
  const low = weakest(g.result > 0 ? g.towers : g.oppTowers);
  return low != null && low > 0 && low <= CLOSE_HP ? 'close' : 'blowout';
}

export type Record3 = { w: number; l: number; d: number; games: number; rate: number | null };
const record = (gs: H2HGame[]): Record3 => {
  const w = gs.filter((g) => g.result > 0).length;
  const l = gs.filter((g) => g.result < 0).length;
  return { w, l, d: gs.length - w - l, games: gs.length, rate: w + l ? w / (w + l) : null };
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export type ElixirStats = {
  /** Average elixir leaked, over the games where the API reported it. */
  leak: number | null;
  leakWins: number | null;
  leakLosses: number | null;
  leakGames: number;
  close: Record3;
  blowout: Record3;
  /** Close-game wins as a share of close games decided. */
  clutch: number | null;
};

export function elixirStats(games: H2HGame[]): ElixirStats {
  const withLeak = games.filter((g) => g.leak != null);
  const close = games.filter((g) => closeness(g) === 'close');
  const blow = games.filter((g) => closeness(g) === 'blowout');
  const c = record(close);
  return {
    leak: avg(withLeak.map((g) => g.leak!)),
    leakWins: avg(withLeak.filter((g) => g.result > 0).map((g) => g.leak!)),
    leakLosses: avg(withLeak.filter((g) => g.result < 0).map((g) => g.leak!)),
    leakGames: withLeak.length,
    close: c,
    blowout: record(blow),
    clutch: c.rate,
  };
}

/* ---------- playstyle ---------- */

export const STYLES = ['Beatdown', 'Cycle', 'Bait', 'Control'] as const;
export type Style = (typeof STYLES)[number];

const BEATDOWN = new Set(['golem', 'lava-hound', 'electro-giant', 'giant', 'goblin-giant', 'elixir-golem', 'royal-giant', 'rune-giant', 'giant-skeleton', 'mega-knight', 'goblinstein']);
const CYCLE = new Set(['hog-rider', 'wall-breakers', 'royal-hogs', 'battle-ram', 'ram-rider', 'miner', 'goblin-drill', 'balloon', 'skeleton-barrel', 'suspicious-bush']);
const BAIT = new Set(['goblin-barrel', 'princess', 'goblin-gang', 'dart-goblin', 'skeleton-barrel', 'rascals', 'spear-goblins', 'bats', 'minion-horde', 'skeleton-army', 'goblins', 'guards', 'royal-recruits', 'goblin-hut', 'barbarian-barrel', 'the-log']);
const CONTROL = new Set(['x-bow', 'mortar', 'graveyard', 'pekka', 'poison', 'tornado', 'lightning', 'rocket', 'earthquake', 'inferno-tower', 'tesla', 'bomb-tower', 'cannon', 'goblin-cage', 'tombstone', 'bowler', 'executioner', 'freeze', 'void', 'goblin-curse']);

/** A deck from a stored game ("26000056e,26000010,…") as card slugs and average elixir. */
export function parseDeck(deck: string | null | undefined): { slugs: string[]; elixir: number | null } | null {
  if (!deck) return null;
  const cards = deck.split(',').map((x) => cardById(Number(x.replace(/[eh]$/, ''))));
  if (cards.length !== 8 || cards.some((c) => !c)) return null;
  const els = cards.map((c) => c!.elixir ?? 0);
  return { slugs: cards.map((c) => c!.slug), elixir: els.reduce((a, b) => a + b, 0) / 8 };
}

const clamp = (x: number) => Math.max(0, Math.min(1, x));

/**
 * How much a deck leans each way, 0–1 per style: beatdown has a heavy tank and a high average
 * cost; cycle a fast win condition and a low one; bait several cheap swarms and spell-bait cards;
 * control a siege or spell win condition plus defensive buildings and big spells.
 */
export function deckStyle(slugs: string[], elixir: number): Record<Style, number> {
  const has = (set: Set<string>) => slugs.filter((s) => set.has(s)).length;
  return {
    Beatdown: clamp((has(BEATDOWN) ? 0.6 : 0) + clamp((elixir - 3.6) / 1.0) * 0.4),
    Cycle: clamp((has(CYCLE) ? 0.5 : 0) + clamp((3.6 - elixir) / 0.8) * 0.5),
    Bait: clamp(has(BAIT) / 4),
    Control: clamp(has(CONTROL) / 4 + (slugs.some((s) => ['x-bow', 'mortar', 'graveyard'].includes(s)) ? 0.3 : 0)),
  };
}

export type Playstyle = { scores: Record<Style, number>; main: Style | null; games: number; decks: number };

/** The average lean over every stored game with a known deck. */
export function playstyle(games: H2HGame[]): Playstyle {
  const decks = games.flatMap((g) => parseDeck(g.deck) ?? []);
  const scores = Object.fromEntries(STYLES.map((s) => [s, 0])) as Record<Style, number>;
  for (const d of decks) {
    const st = deckStyle(d.slugs, d.elixir ?? 0);
    for (const s of STYLES) scores[s] += st[s] / decks.length;
  }
  const main = decks.length ? STYLES.reduce((a, b) => (scores[b] > scores[a] ? b : a)) : null;
  return { scores, main, games: decks.length, decks: new Set(games.map((g) => g.deck).filter(Boolean)).size };
}

/* ---------- time and tilt ---------- */

/** Win rate by weekday (0 = Sunday) and hour, in whatever local time `at` gives. */
export function heatmap(games: { time: string; result: -1 | 0 | 1 }[], at: (iso: string) => { day: number; hour: number }) {
  const cells = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ w: 0, l: 0 })));
  for (const g of games) {
    if (!g.result) continue;
    const { day, hour } = at(g.time);
    if (g.result > 0) cells[day][hour].w++;
    else cells[day][hour].l++;
  }
  return cells;
}

/** Games that count for streaks and tilt: competitive ones, not friendlies or war training. */
const counts = (g: H2HGame) => g.kind !== 'friendly' && g.kind !== 'training';

export type Tilt = {
  /** The player's record in the game right after `after` straight losses. */
  next: Record3;
  after: number;
  /** Losses in a row right now. */
  current: number;
};

/** How the player does after a losing run, from the stored history. */
export function tilt(gamesNewestFirst: H2HGame[], after = 3): Tilt {
  const seq = gamesNewestFirst.filter(counts).filter((g) => g.result !== 0).reverse();
  const next: H2HGame[] = [];
  let run = 0;
  for (const g of seq) {
    if (run >= after) next.push(g);
    run = g.result < 0 ? run + 1 : 0;
  }
  let current = 0;
  for (const g of gamesNewestFirst.filter(counts)) {
    if (g.result < 0) current++;
    else if (g.result > 0) break;
  }
  return { next: record(next), after, current };
}

/* ---------- achievements ---------- */

export type Achievement = { id: string; name: string; rule: string; earned: boolean; progress: number; goal: number; detail: string };

/**
 * Site achievements the game doesn't have. `war` is the player's decks per river race, newest
 * first (from their clan's race log).
 */
export function achievements(games: H2HGame[], war: { decks: number }[] | null): Achievement[] {
  const comp = games.filter(counts);
  const seq = [...comp].reverse();
  // Iron Man: every war deck (16) in each race, counted back from the latest.
  let iron = 0;
  for (const w of war ?? []) {
    if (w.decks >= 16) iron++;
    else break;
  }
  // Comeback King: three wins in a row straight after three losses in a row (draws don't break it).
  const runs = seq.map((g) => (g.result > 0 ? 'W' : g.result < 0 ? 'L' : '')).join('');
  const comebacks = runs.match(/L{3,}W{3}/g)?.length ?? 0;
  const slain = comp.filter((g) => g.result > 0 && (g.levelGap ?? 0) >= 3).length;
  const friendlyWins = games.filter((g) => g.kind === 'friendly' && g.result > 0).length;
  const clutchWins = comp.filter((g) => g.result > 0 && closeness(g) === 'close').length;
  const flawless = comp.filter((g) => g.result > 0 && g.crowns === 3 && g.oppCrowns === 0).length;
  const leaks = comp.filter((g) => g.leak != null).map((g) => g.leak!);
  const miser = leaks.length >= 20 ? (avg(leaks) ?? 99) : null;
  const a = (id: string, name: string, rule: string, progress: number, goal: number, detail: string): Achievement => ({ id, name, rule, earned: progress >= goal, progress: Math.min(progress, goal), goal, detail });
  return [
    a('iron-man', 'Iron Man', 'All 16 war decks in 10 river races in a row', iron, 10, war ? `${iron} race${iron === 1 ? '' : 's'} in a row` : 'Needs a clan race log'),
    a('comeback', 'Comeback King', 'Three wins in a row straight after three losses in a row', comebacks, 1, `${comebacks} time${comebacks === 1 ? '' : 's'}`),
    a('giant-slayer', 'Giant Slayer', "Beat a deck whose eight cards were 3+ levels higher than yours in total", slain, 1, `${slain} win${slain === 1 ? '' : 's'}`),
    a('friendly-menace', 'Friendly Menace', 'Win 10 friendly battles', friendlyWins, 10, `${friendlyWins} friendly win${friendlyWins === 1 ? '' : 's'}`),
    a('clutch', 'Clutch Master', `Win 10 close games (one crown in it, or a tower left under ${CLOSE_HP} HP)`, clutchWins, 10, `${clutchWins} close win${clutchWins === 1 ? '' : 's'}`),
    a('flawless', 'Flawless', 'Ten 3–0 wins', flawless, 10, `${flawless} three-crown shutout${flawless === 1 ? '' : 's'}`),
    a('miser', 'Elixir Miser', 'Leak under 1 elixir a game on average, over 20+ games', miser != null && miser < 1 ? 1 : 0, 1, miser != null ? `${miser.toFixed(2)} leaked a game` : `${leaks.length} of 20 games`),
  ];
}

/** Everything the player page shows from stored games, ready to send to the browser. */
export type Insights = {
  games: number;
  since: string | null;
  elixir: ElixirStats;
  playstyle: Playstyle;
  tilt: Tilt;
  achievements: Achievement[];
  /** [time, result] per game, newest first, for the heatmap (drawn in the viewer's time zone). */
  times: [string, -1 | 0 | 1][];
};

export function insightsOf(games: H2HGame[], war: { decks: number }[] | null): Insights {
  return {
    games: games.length,
    since: games.at(-1)?.time ?? null,
    elixir: elixirStats(games),
    playstyle: playstyle(games),
    tilt: tilt(games),
    achievements: achievements(games, war),
    times: games.filter(counts).slice(0, 2000).map((g) => [g.time, g.result]),
  };
}
