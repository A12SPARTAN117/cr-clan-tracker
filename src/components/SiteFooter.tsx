import Link from 'next/link';
import s from './SiteFooter.module.css';

/** Global footer. The fan-content disclaimer is required, verbatim, on every page. */
export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <p className={s.disclaimer}>
        This content is not affiliated with, endorsed, sponsored, or specifically approved by Supercell and Supercell is not
        responsible for it. For more information see{' '}
        <a href="https://www.supercell.com/fan-content-policy" target="_blank" rel="noreferrer">
          Supercell&apos;s Fan Content Policy
        </a>
        .
      </p>
      <nav className={s.nav} aria-label="Footer">
        <Link href="/cards">Cards</Link>
        <Link href="/leaderboards">Leaderboards</Link>
        <Link href="/news">News</Link>
        <Link href="/help">Help</Link>
        <Link href="/support">Support us</Link>
        <span className={s.muted}>CR Clan Tracker · Fan-made</span>
      </nav>
    </footer>
  );
}
