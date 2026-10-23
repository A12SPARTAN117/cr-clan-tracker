'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FEATURES } from '@/lib/features';
import { checkTag, searchHref } from '@/lib/tags';
import { getTheme, toggleTheme, type Theme } from './fx/motion';
import s from './SiteNav.module.css';

const LINKS = [
  { href: '/players', label: 'Players', match: ['/players', '/player/'] },
  { href: '/clans', label: 'Clans', match: ['/clans', '/clan/'] },
  { href: '/my-clan', label: 'My Clan', match: ['/my-clan', '/manage'] },
  { href: '/decks', label: 'Decks', match: ['/decks', '/decks/builder'] },
  { href: '/compare', label: 'Compare', match: ['/compare'] },
  { href: '/rivals', label: 'Rivals', match: ['/rivals'] },
  { href: '/leaderboards', label: 'Leaderboards', match: ['/leaderboards'] },
  ...(FEATURES.news ? [{ href: '/news', label: 'News', match: ['/news'] }] : []),
  { href: '/help', label: 'Help', match: ['/help'] },
  { href: '/support', label: 'Support', match: ['/support'] },
];

/** Every page, for the menu sheet on phones and tablets (the header links need a laptop's width). */
const MENU = [
  { href: '/', label: 'Home', match: [] as string[] },
  ...LINKS.slice(0, 3),
  { href: '/decks', label: 'Decks', match: ['/decks'] },
  { href: '/decks/builder', label: 'Deck builder', match: ['/decks/builder'] },
  ...LINKS.slice(4, 7),
  { href: '/cards', label: 'Cards', match: ['/cards'] },
  { href: '/goals', label: 'Goals', match: ['/goals'] },
  ...LINKS.slice(7),
];

const TABS = [
  { href: '/', label: 'HOME', match: [], icon: { width: 16, height: 2, border: 0, background: 'currentColor' } },
  { href: '/clans', label: 'CLANS', match: ['/clans', '/clan/'], icon: { borderRadius: '50%' } },
  { href: '/my-clan', label: 'MY CLAN', match: ['/my-clan', '/manage'], icon: { transform: 'rotate(45deg)' } },
  { href: '/decks', label: 'DECKS', match: ['/decks', '/decks/builder'], icon: { width: 10, height: 14, borderRadius: 2 } },
];

function isActive(pathname: string, match: string[]) {
  // /clan/X/manage belongs to "My Clan", not "Clans"; /player/X/rivals(/Y) to "Rivals", not "Players"
  if (pathname.endsWith('/manage')) return match.includes('/manage');
  if (/\/rivals(\/|$)/.test(pathname)) return match.includes('/rivals');
  if (/\/goals$/.test(pathname)) return match.includes('/goals');
  // The builder lights "Decks" in the header and tab bar, and only "Deck builder" in the menu.
  if (pathname === '/decks/builder') return match.includes('/decks/builder');
  return match.some((m) => (m.endsWith('/') ? pathname.startsWith(m) : pathname === m || pathname.startsWith(m + '/')));
}

function subscribeTheme(cb: () => void) {
  window.addEventListener('oa-theme', cb);
  return () => window.removeEventListener('oa-theme', cb);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark');
}

export function ThemeToggle({ className, labelClassName }: { className?: string; labelClassName?: string }) {
  const theme = useTheme();
  return (
    <button type="button" className={className} onClick={() => toggleTheme()} aria-label="Toggle theme">
      <span aria-hidden>{theme === 'light' ? '◐' : '◑'}</span> <span className={labelClassName}>{theme === 'light' ? 'Marble' : 'Obsidian'}</span>
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

function NavSearch({ className, hotkey = true, onGo }: { className?: string; hotkey?: boolean; onGo?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const c = checkTag(q);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [hotkey]);

  const hint = c.kind === 'empty' ? (hotkey ? '⌘K' : '') : c.kind === 'valid' ? 'TAG ↵' : 'NAME ↵';
  return (
    <label className={`${s.search} ${className ?? ''}`} data-bad={c.kind === 'invalid' && !/\s/.test(q) && q.trim().startsWith('#')}>
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
            onGo?.();
          }
        }}
        placeholder="Tag or name"
        aria-label="Search players and clans"
        enterKeyHint="search"
        autoCorrect="off"
        spellCheck={false}
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
  const [menu, setMenu] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // The menu sheet closes itself when the route changes (a link or a search inside it).
  if (menu && menuPath !== pathname) setMenu(false);
  const toggleMenu = () => {
    setMenuPath(pathname);
    setMenu(!menu);
  };

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(scrollY > innerHeight * 0.7);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, [overlay]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    // At laptop width the header shows every link, so the sheet has nothing left to do.
    const wide = matchMedia('(min-width: 1000px)');
    const onWide = () => wide.matches && setMenu(false);
    addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    document.documentElement.dataset.menu = 'open';
    return () => {
      removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
      delete document.documentElement.dataset.menu;
    };
  }, [menu]);

  const tabOn = TABS.map((t) => (t.href === '/' ? pathname === '/' : isActive(pathname, t.match)));
  const moreOn = menu || !tabOn.some(Boolean);

  return (
    <>
      <header
        className={`${s.header} ${overlay ? s.overlay : ''} ${overlay && (scrolled || menu) ? s.scrolled : ''}`}
        data-menu={menu || undefined}
      >
        <HoverLink href="/" className={s.brand} aria-label="CR Clan Tracker home">
          <BrandMark />
          <span className={s.brandText}>
            CR·CLAN<span className={s.brandSlash}>/</span>TRACKER
          </span>
        </HoverLink>
        <nav className={s.links} aria-label="Main">
          {LINKS.map((l) => (
            <HoverLink key={l.href} href={l.href} className={l.href === '/support' ? `${s.link} ${s.support}` : s.link} aria-current={isActive(pathname, l.match) ? 'page' : undefined}>
              {l.label}
            </HoverLink>
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
        <ThemeToggle className={s.theme} labelClassName={s.themeLabel} />
        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={menu}
          aria-controls="site-menu"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          onClick={toggleMenu}
        >
          <span className={s.burger} data-open={menu} aria-hidden />
        </button>
      </header>
      {menu && (
        <>
          <div className={s.backdrop} onClick={() => setMenu(false)} aria-hidden />
          <div id="site-menu" className={s.sheet} role="dialog" aria-label="Site menu">
            <NavSearch className={s.sheetSearch} hotkey={false} onGo={() => setMenu(false)} />
            <nav className={s.sheetLinks} aria-label="All pages">
              {MENU.map((l) => {
                const cur = l.href === '/' ? pathname === '/' : isActive(pathname, l.match);
                return (
                  <HoverLink key={l.href} href={l.href} className={s.sheetLink} aria-current={cur ? 'page' : undefined} onClick={() => setMenu(false)}>
                    {l.label}
                    <span aria-hidden>→</span>
                  </HoverLink>
                );
              })}
            </nav>
          </div>
        </>
      )}
      <nav className={s.tabbar} aria-label="Primary">
        {TABS.map((t, i) => (
          <HoverLink key={t.href} href={t.href} className={s.tab} aria-current={tabOn[i] && !menu ? 'page' : undefined}>
            <span className={s.tabIcon} style={t.icon} />
            {t.label}
          </HoverLink>
        ))}
        <button
          type="button"
          className={s.tab}
          aria-expanded={menu}
          aria-controls="site-menu"
          data-on={moreOn}
          onClick={toggleMenu}
        >
          <span className={s.tabIcon} style={{ borderRadius: '50%', borderStyle: 'dotted' }} />
          {menu ? 'CLOSE' : 'MORE'}
        </button>
      </nav>
    </>
  );
}
