import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Keeps crawlers off endpoints and redirects, which would only burn API requests. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/t/', '/design-system', '/down.html'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
