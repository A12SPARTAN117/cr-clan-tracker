// Site news. The official API has no news feed, so posts here are written by hand.
// Only publish what is true: site updates and guides about how the numbers work.
// Balance-change posts (tag BALANCE) list each card with a 'buff' | 'nerf' | 'rework' change.

export type NewsTag = 'SITE UPDATE' | 'GUIDE' | 'BALANCE' | 'OFFICIAL';

export type BalanceChange = { card: string; kind: 'buff' | 'nerf' | 'rework'; text: string };

export type NewsPost = {
  slug: string;
  tag: NewsTag;
  date: string; // ISO date
  title: string;
  summary: string;
  scene: string;
  body: string[];
  changes?: BalanceChange[];
};

export const NEWS: NewsPost[] = [
  {
    slug: 'early-access',
    tag: 'SITE UPDATE',
    date: '2026-10-13',
    title: 'CR Clan Tracker opens in early access',
    summary: 'Player and clan lookups, meta decks and leaderboards are live. Clan history builds up from today.',
    scene: '/scenes/arena.jpg',
    body: [
      'CR Clan Tracker is a free, fan-made site for Clash Royale players and clan leaders. Search any player or clan tag from the home page or the bar at the top.',
      'Player profiles, clan pages, meta decks and Path of Legends leaderboards read live data from the official Clash Royale API, cached for a few minutes so the site stays fast.',
      'The clan dashboard shows who is active, who plays war, and an Asset Score for every member. Leaders can change the score weights, and the weights are saved on their own device.',
      'The official API only shows the present moment. Anything historical, such as who left the clan, trophy trends or war participation beyond the last ten races, is built from our own snapshots. So history starts on the day a clan is first tracked, and every page says so.',
    ],
  },
  {
    slug: 'how-meta-decks-work',
    tag: 'GUIDE',
    date: '2026-10-13',
    title: 'How we measure the meta',
    summary: 'Top decks come from the battle logs of the global Path of Legends top 100, refreshed every hour.',
    scene: '/scenes/deck-slot.jpg',
    body: [
      'There is no official meta endpoint, so we build one. Every hour we read the battle logs of the global Path of Legends top 100 and keep the battles from the last 24 hours.',
      'Both decks in every battle count: the top player’s and their opponent’s. A battle between two top players only counts once.',
      'Use is the share of all decks seen that match exactly, with the same evolution and hero slots. Win rate is the share of those games the deck won. Small samples swing a lot, so each row shows its game count.',
      'Card stats work the same way, per card instead of per deck.',
    ],
  },
  {
    slug: 'asset-score',
    tag: 'GUIDE',
    date: '2026-10-13',
    title: 'What the Asset Score means',
    summary: 'A 0–100 score per member built from war, donations, activity, war win rate and tenure.',
    scene: '/scenes/war-room.jpg',
    body: [
      'Every member gets a score from 0 to 100 for five factors. The Asset Score is their weighted average.',
      'War: decks used this week compared with the decks possible so far (60%), plus participation over the tracked races (40%). Donations: cards donated this week, maxing out at 750. Activity: 100 if seen in the last day, then falling with every hour away. War win rate: from tracked war battles, where 30% scores 0 and 75% scores 100. Tenure: days in the clan, maxing out at one year.',
      'Default weights are war 35, donations 20, activity 20, win rate 15 and tenure 10. Leaders can change them on the Score settings tab and see how the ranking moves.',
      'The score is a starting point for a conversation, not a verdict. Suggestions only. The leader decides.',
    ],
  },
];

export const newsBySlug = (slug: string) => NEWS.find((n) => n.slug === slug);
