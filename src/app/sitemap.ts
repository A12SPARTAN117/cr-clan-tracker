import type { MetadataRoute } from 'next';
import { CARDS, TOWER_TROOPS } from '@/lib/cards';
import { FEATURES } from '@/lib/features';
import { SITE_URL } from '@/lib/site';

/** The site's own pages and every card's page. Player and clan pages are endless, so search engines find them through links. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/players', '/clans', '/my-clan', '/decks', '/decks/builder', '/compare', '/rivals', '/leaderboards', '/cards', '/goals', '/help', '/support'];
  if (FEATURES.news) pages.push('/news');
  const cards = [...CARDS, ...TOWER_TROOPS].map((c) => ({ url: `${SITE_URL}/cards/${c.slug}`, changeFrequency: 'daily' as const, priority: 0.5 }));
  return [...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: p === '/support' || p === '/help' ? ('monthly' as const) : ('daily' as const), priority: p === '' ? 1 : 0.7 })), ...cards];
}
