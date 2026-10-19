/**
 * The official API can't search players by name, so names only find people already in our
 * directory. Say so plainly, every time: a tag search once puts them in it for good.
 */
export function TagFirst({ found }: { found: boolean }) {
  return (
    <div className="data-since" style={{ textTransform: 'none', letterSpacing: '.02em', font: '500 13px/1.5 var(--sans)', color: 'var(--text-1)' }}>
      <span>
        <b>{found ? 'Not seeing everyone?' : 'Not found yet?'}</b> Search with the player&apos;s <b>#tag</b> first (it&apos;s under their name on their
        in-game profile). Once a tag has been searched here, that player shows up by name from then on, and searching a clan&apos;s tag adds every
        member.
      </span>
    </div>
  );
}
