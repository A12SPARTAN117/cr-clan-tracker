/** The site's social accounts. Feedback goes to Reddit, where anyone can comment or message. */
export const SOCIAL = [
  { id: 'reddit', label: 'Reddit', url: 'https://www.reddit.com/user/CRClanTracker/' },
  { id: 'x', label: 'X', url: 'https://x.com/CRClanTracker' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/crclantracker/' },
] as const;

export const FEEDBACK_URL = SOCIAL[0].url;
