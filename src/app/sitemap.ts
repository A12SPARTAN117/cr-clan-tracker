import type { MetadataRoute } from 'next';
import { FEATURES } from '@/lib/features';
import { SITE_URL } from '@/lib/site';

/** The site's own pages. Player and clan pages are endless, so search engines find them through links. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/players', '/clans', '/my-clan', '/decks', '/decks/builder', '/compare', '/rivals', '/leaderboards', '/cards', '/goals', '/help', '/support'];
  if (FEATURES.news) pages.push('/news');
  return pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: p === '/support' || p === '/help' ? 'monthly' : 'daily', priority: p === '' ? 1 : 0.7 }));
}
