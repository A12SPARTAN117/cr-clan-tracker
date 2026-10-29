import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { AmbientEmbers } from '@/components/fx/AmbientEmbers';
import { MotionLayer } from '@/components/fx/MotionLayer';
import { Grain } from '@/components/fx/Grain';
import { RefreshOnReturn } from '@/components/Freshness';
import { ServiceWorker } from '@/components/ServiceWorker';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SITE_URL } from '@/lib/site';
import { X_HANDLE } from '@/lib/social';
import { mono, sans } from './fonts';
import './globals.css';

const DESCRIPTION =
  'Free, fan-made Clash Royale stats: players, clans, meta decks, leaderboards, and clan management with an Asset Score for every member.';

export const metadata: Metadata = {
  // Link previews need absolute image URLs; Vercel names the production domain.
  metadataBase: new URL(SITE_URL),
  title: { default: 'CR Clan Tracker', template: '%s · CR Clan Tracker' },
  description: DESCRIPTION,
  // The preview card when a link is shared (the image is app/opengraph-image.jpg, drawn by brand/src/render.mjs).
  openGraph: { type: 'website', siteName: 'CR Clan Tracker', title: 'CR Clan Tracker', description: DESCRIPTION, locale: 'en_US' },
  twitter: { card: 'summary_large_image', site: X_HANDLE, creator: X_HANDLE },
};

export const viewport: Viewport = {
  themeColor: '#07080A',
  // Fill the whole screen on notched phones; the header, tab bar and gutters pad for the safe areas.
  viewportFit: 'cover',
};

// Applies the saved theme before first paint so Marble Day never flashes dark.
const themeScript = `(function(){try{var t=localStorage.getItem('oa-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-theme="dark" className={`${mono.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AmbientEmbers />
        <SiteNav />
        {children}
        <SiteFooter />
        <Grain />
        <Suspense fallback={null}>
          <MotionLayer />
        </Suspense>
        <ServiceWorker />
        <RefreshOnReturn />
        {/* Visitor counts (cookieless). Only on Vercel: its script is served from our own origin
            there (/_vercel/insights), so the CSP needs no new host; locally it would 404. */}
        {process.env.VERCEL === '1' && (
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
      </body>
    </html>
  );
}
