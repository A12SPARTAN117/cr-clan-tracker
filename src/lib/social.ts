/** The site's social accounts. Feedback goes to Reddit, where anyone can comment or message. */
export const SOCIAL = [
  { id: 'reddit', label: 'Reddit', handle: 'u/CRClanTracker', url: 'https://www.reddit.com/user/CRClanTracker/', blurb: 'Feedback, bug reports and feature ideas' },
  { id: 'x', label: 'X', handle: '@CRClanTracker', url: 'https://x.com/CRClanTracker', blurb: 'New features, meta shifts and site news' },
  { id: 'instagram', label: 'Instagram', handle: '@crclantracker', url: 'https://www.instagram.com/crclantracker/', blurb: 'Meta decks, clan tips and sneak peeks' },
] as const;

export type SocialId = (typeof SOCIAL)[number]['id'];

export const FEEDBACK_URL = SOCIAL[0].url;
/** For link previews on X (twitter:site). */
export const X_HANDLE = SOCIAL[1].handle;
