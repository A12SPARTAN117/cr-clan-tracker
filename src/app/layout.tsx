import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { AmbientEmbers } from '@/components/fx/AmbientEmbers';
import { MotionLayer } from '@/components/fx/MotionLayer';
import { Grain } from '@/components/fx/Grain';
import { ServiceWorker } from '@/components/ServiceWorker';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

// Variable fonts: one file per family covers every weight (8 font downloads became 2).
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'CR Clan Tracker', template: '%s · CR Clan Tracker' },
  description:
    'Free, fan-made Clash Royale stats: players, clans, meta decks, leaderboards, and clan management with an Asset Score for every member.',
};

export const viewport: Viewport = {
  themeColor: '#07080A',
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
      </body>
    </html>
  );
}
