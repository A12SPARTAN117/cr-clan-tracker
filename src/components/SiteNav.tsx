'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { checkTag, searchHref } from '@/lib/tags';
import { getTheme, toggleTheme, type Theme } from './fx/motion';
import s from './SiteNav.module.css';

const LINKS = [
  { href: '/players', label: 'Players', match: ['/players', '/player/'] },
  { href: '/clans', label: 'Clans', match: ['/clans', '/clan/'] },
  { href: '/my-clan', label: 'My Clan', match: ['/my-clan', '/manage'] },
  { href: '/decks', label: 'Decks', match: ['/decks'] },
  { href: '/compare', label: 'Compare', match: ['/compare'] },
  { href: '/leaderboards', label: 'Leaderboards', match: ['/leaderboards'] },
  { href: '/news', label: 'News', match: ['/news'] },
];

const TABS = [
  { href: '/', label: 'HOME', icon: { width: 16, height: 2, border: 0, background: 'currentColor' } },
  { href: '/clans', label: 'SEARCH', icon: { borderRadius: '50%' } },
  { href: '/my-clan', label: 'MY CLAN', icon: { transform: 'rotate(45deg)' } },
  { href: '/decks', label: 'DECKS', icon: { width: 10, height: 14, borderRadius: 2 } },
  { href: '/cards', label: 'MORE', icon: { borderRadius: '50%', borderStyle: 'dotted' } },
];

function isActive(pathname: string, match: string[]) {
  // /clan/X/manage belongs to "My Clan", not "Clans"
  if (pathname.endsWith('/manage')) return match.includes('/manage');
  return match.some((m) => (m.endsWith('/') ? pathname.startsWith(m) : pathname === m || pathname.startsWith(m + '/')));
}

function subscribeTheme(cb: () => void) {
  window.addEventListener('oa-theme', cb);
  return () => window.removeEventListener('oa-theme', cb);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark');
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  return (
    <button type="button" className={className} onClick={() => toggleTheme()} aria-label="Toggle theme">
      {theme === 'light' ? '◐ Marble' : '◑ Obsidian'}
    </button>
  );
}

export function BrandMark() {
  return (
    <svg width="30" height="26" viewBox="0 0 30 26" aria-hidden style={{ filter: 'drop-shadow(0 0 6px rgba(var(--glow-rgb), .6))' }}>
      <polyline points="2,22 2,8 8,14 12,4 16,14 22,8 22,22 2,22" fill="none" stroke="var(--text-2)" strokeWidth="1.4" strokeLinejoin="round" />
      <polyline points="8,24 8,10 14,16 18,6 22,16 28,10 28,24 8,24" fill="none" stroke="var(--blue-hi)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function NavSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const c = checkTag(q);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const hint = c.kind === 'empty' ? '⌘K' : c.kind === 'valid' ? 'TAG ↵' : 'NAME ↵';
  return (
    <label className={s.search} data-bad={c.kind === 'invalid' && !/\s/.test(q) && q.trim().startsWith('#')}>
      <span className={s.hash}>#</span>
      <input
        ref={input}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          const href = searchHref(q);
          if (href) {
            router.push(href);
            setQ('');
            input.current?.blur();
          }
        }}
        placeholder="Tag or name"
        aria-label="Search players and clans"
      />
      <span className={s.hint} data-ok={c.kind === 'valid'}>
        {hint}
      </span>
    </label>
  );
}

/** Global nav. The pathname is runtime data on dynamic routes, so it streams in under Suspense. */
export function SiteNav() {
  return (
    <Suspense fallback={<NavView pathname={null} />}>
      <NavWithPath />
    </Suspense>
  );
}

function NavWithPath() {
  return <NavView pathname={usePathname()} />;
}

function NavView({ pathname: path }: { pathname: string | null }) {
  const pathname = path ?? '';
  const overlay = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(scrollY > innerHeight * 0.7);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, [overlay]);

  return (
    <>
      <header className={`${s.header} ${overlay ? s.overlay : ''} ${overlay && scrolled ? s.scrolled : ''}`}>
        <Link href="/" className={s.brand} aria-label="CR Clan Tracker home">
          <BrandMark />
          <span className={s.brandText}>
            CR·CLAN<span className={s.brandSlash}>/</span>TRACKER
          </span>
        </Link>
        <nav className={s.links} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={s.link} aria-current={isActive(pathname, l.match) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className={s.grow} />
        {overlay && (
          <span className={s.online}>
            <span className={`live-dot ${s.dot}`} />
            ONLINE
          </span>
        )}
        {!overlay && <NavSearch />}
        <ThemeToggle className={s.theme} />
      </header>
      <nav className={s.tabbar} aria-label="Primary">
        {TABS.map((t) => {
          const cur = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={s.tab} aria-current={cur ? 'page' : undefined}>
              <span className={s.tabIcon} style={t.icon} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
