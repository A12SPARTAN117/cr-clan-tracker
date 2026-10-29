import { FEATURES as ON } from '@/lib/features';
/**
 * The Help page's content: quick start, the feature list and step-by-step guides. Keep it in
 * step with the site; every instruction here names a real button or tab.
 */

export type Feature = { title: string; text: string; href: string; cta: string };
export type Guide = { id: string; title: string; intro: string; steps: string[]; tips?: string[] };

export const QUICK_START: { title: string; text: string }[] = [
  {
    title: 'Find your tag',
    text: 'In Clash Royale, open your profile. Your tag is the code under your name that starts with #, like #QULLYLUC. Your clan has one too, on the clan screen.',
  },
  {
    title: 'Search for it',
    text: 'Type a player or clan name, or a #tag, into the search box on Home or at the top of any page, and press Enter. If a tag belongs to both a player and a clan, you pick which.',
  },
  {
    title: 'Pin yourself',
    text: 'On your profile press Pin as me, and on your clan press Pin. Home then opens straight to your player and clan, with your streak and war fame. Pins stay on this device only.',
  },
];

export const FEATURES: Feature[] = [
  { title: 'Player profiles', text: 'Stats, win streak, recent battles, worst enemy, current deck, full collection, badges and history.', href: '/players', cta: 'Look up a player' },
  { title: 'Clan profiles', text: 'Members, river race standing, war history and roster changes for any clan.', href: '/clans', cta: 'Find a clan' },
  { title: 'Clan dashboard', text: 'For leaders: an Asset Score for every member, activity, war decks, promotion picks and who has gone quiet.', href: '/my-clan', cta: 'Open My Clan' },
  { title: 'Meta decks', text: 'The most used and best performing decks in every game mode from the last 24 hours, with card stats.', href: '/decks', cta: 'See the meta' },
  { title: 'Compare', text: 'Up to four players or clans side by side in a 3D showdown, with every stat and who leads it.', href: '/compare', cta: 'Start a showdown' },
  { title: 'Leaderboards', text: 'Path of Legends, clan trophies, clan wars and event boards, global or by country.', href: '/leaderboards', cta: 'View leaderboards' },
  { title: 'Cards', text: 'Every card with its rarity, elixir and how much it is played and wins in each mode.', href: '/cards', cta: 'Browse cards' },
  ...(ON.news ? [{ title: 'News', text: 'Site updates, balance notes and guides like how the Asset Score works.', href: '/news', cta: 'Read news' }] : []),
];

export const GUIDES: Guide[] = [
  {
    id: 'search',
    title: 'Searching for players and clans',
    intro: 'One search box finds everything: player names, player tags, clan names and clan tags.',
    steps: [
      'Use the big search on Home, the box at the top right of every page, or on a phone the Menu button (☰), which has search at the top.',
      'Type a name to see suggestions as you go, or paste a #tag and press Enter to jump straight there.',
      'For more results, press Enter on a name: the search page lists every match and lets you show only players or only clans.',
      'On a computer, press Ctrl+K (⌘K on Mac) from any page to jump into the search box.',
    ],
    tips: [
      'Clan names come straight from the official search. Player names come from our own directory, which grows as people use the site, so a tag always works even when a name doesn\'t show up yet.',
    ],
  },
  {
    id: 'player',
    title: 'Reading a player profile',
    intro: 'Each profile has tabs along the top. They scroll sideways on a phone.',
    steps: [
      'Overview: lifetime stats, the current win or loss streak, the last 30 battles (each square shows the game mode and W or L), the card they lose to most, and their current deck.',
      'Collection: Summary, Levels, Mastery and Upgrades views of every card, hero and evolution they own.',
      'Badges: every badge with its level and progress. Press Show all to see the full set in a group.',
      'Stats and Battles: detailed numbers, and the battle log with a filter for each game mode.',
      'Decks: every deck in their battle log with its win rate. History: their Path of Legends seasons, plus trophy, clan and war history from the days we\'ve been tracking them.',
      'Copy deck on the current deck opens it in Clash Royale on your phone.',
    ],
  },
  {
    id: 'clans',
    title: 'Finding a clan',
    intro: 'The Clans page starts with the top war clans and filters down to the right one.',
    steps: [
      'Type a clan name (3+ letters) or a #tag into the search box.',
      'Narrow the list with Location, Min members, War trophies and Type (Open, Invite only, Closed).',
      'Open a clan to see its members, the live river race, past wars and recent roster changes.',
    ],
  },
  {
    id: 'dashboard',
    title: 'Running your clan from the dashboard',
    intro: 'The dashboard is built for leaders and co-leaders. Open it from My Clan, or Manage this clan on any clan page.',
    steps: [
      'The tiles up top show members, who was active today, war participation, decks played today, the average Asset Score and who is flagged inactive.',
      'Every member gets an Asset Score from 0 to 100 built from war, donations, activity, win rate and loyalty.',
      'Change how much each part counts on the Score settings tab. Your weights are saved on this device and the ranking updates as you drag.',
      'Filter members by role, activity, war decks, trophies or new joiners, and sort by any column.',
      'Click a member to open their details. Use ↑ and ↓ to move between members and Esc to close.',
      'Tick members to Compare them, Export CSV or Copy names for a clan message.',
      'Promotion candidates and At risk are suggestions only. The leader decides.',
      'The War tab shows every member\'s decks this week and past races. Roster changes lists joins, leaves, promotions and demotions.',
    ],
    tips: [
      'The official API only shows the present moment. History such as roster changes and long-term war participation starts the day a clan is first tracked on this site, and every page says when that was.',
    ],
  },
  {
    id: 'decks',
    title: 'Using the meta decks',
    intro: 'Decks are built from thousands of real battles by top players over the last 24 hours.',
    steps: [
      'Pick a game mode from the row of tiles: Ranked, Ultimate Champion, Ladder, Clan War, 2v2 and the current events.',
      'Sort by Most used, or by Highest win %, which only counts decks with enough games to trust.',
      'Use Includes and Excludes to find decks with or without a card you own.',
      'Switch to Card stats for how often each card is played and how often it wins.',
      'Open Deck stats on any deck for its players, similar decks and the matchups it wins and loses.',
    ],
  },
  {
    id: 'compare',
    title: 'Comparing players or clans',
    intro: 'Compare puts up to four players or four clans in one showdown.',
    steps: [
      'Choose Players or Clans, then add each one with the search box (name or #tag).',
      'The 3D arena draws one group of columns per stat, front to back in the order of the numbered legend. Taller is better, and the leader of each stat glows.',
      'The scoreboard counts how many stats each one leads. The overall leader wears the crown.',
      'Every exact number is in the table underneath. Remove someone with the × on their name.',
      'You can also start a comparison from the Compare button on a player or clan page.',
    ],
  },
  {
    id: 'phone',
    title: 'Using the site on a phone or tablet',
    intro: 'Everything works on any screen size.',
    steps: [
      'On a phone, the bar at the bottom jumps to Home, Clans, My Clan and Decks. More opens the full menu.',
      'On a tablet, the Menu button (☰) at the top right opens every page plus search.',
      'Wide tables scroll sideways, and the clan dashboard switches to member cards you can tap.',
      'Add the site to your home screen from your browser\'s share menu to open it like an app.',
    ],
  },
];

export const TIPS: { k: string; v: string }[] = [
  { k: 'Ctrl+K / ⌘K', v: 'Jump to search from any page' },
  { k: 'Esc', v: 'Close the menu, the member drawer or a comparison' },
  { k: '↑ ↓', v: 'Move between members in the dashboard drawer' },
  { k: 'Theme', v: 'Switch between Obsidian (dark) and Marble (light) with the button at the top right' },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Where does the data come from?',
    a: 'Live from the official Clash Royale API, cached for a few minutes so the site stays fast. Press Refresh on a profile or dashboard for the newest numbers.',
  },
  {
    q: 'Why does a player\'s battle history stop after about 40 games?',
    a: 'The official API only returns each player\'s last 40 or so battles. Longer history is built from our own snapshots, which start the day a player or clan is first tracked.',
  },
  {
    q: 'Why can\'t I find a player by name?',
    a: 'The official API can\'t search players by name, so we keep our own directory from the leaderboards and the clans people look up. It grows every day. Searching their #tag always works.',
  },
  {
    q: 'Is this made by Supercell?',
    a: 'No. CR Clan Tracker is a free, independent fan project. It isn\'t affiliated with or endorsed by Supercell.',
  },
  {
    q: 'How do I report a bug or suggest a feature?',
    a: 'Message or comment on our Reddit, u/CRClanTracker (the Feedback link at the bottom of every page). We post updates on X (@CRClanTracker) and Instagram (@crclantracker) too.',
  },
];
