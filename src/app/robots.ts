import type { MetadataRoute } from 'next';

/** Keeps crawlers off endpoints and redirects, which would only burn API requests. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/t/', '/design-system', '/down.html'] },
  };
}
