import { HoverLink } from '@/components/ui/HoverLink';
import { FEATURES } from '@/lib/features';
import { SocialLinks } from '@/components/SocialLinks';
import { FEEDBACK_URL } from '@/lib/social';
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
        <HoverLink href="/cards">Cards</HoverLink>
        <HoverLink href="/goals">Goals</HoverLink>
        <HoverLink href="/leaderboards">Leaderboards</HoverLink>
        {FEATURES.news && <HoverLink href="/news">News</HoverLink>}
        <HoverLink href="/help">Help</HoverLink>
        <HoverLink href="/support">Support us</HoverLink>
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">
          Feedback
        </a>
        <span className={s.muted}>CR Clan Tracker · Fan-made · Beta</span>
      </nav>
      <div className={s.follow}>
        <span className={s.muted}>Follow us</span>
        <SocialLinks />
      </div>
    </footer>
  );
}
