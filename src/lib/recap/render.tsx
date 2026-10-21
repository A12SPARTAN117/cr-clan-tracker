/* eslint-disable @next/next/no-img-element -- Satori draws plain <img>; next/image doesn't exist there */
import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CSSProperties, ReactNode } from 'react';
import { ImageResponse } from 'next/og';
import { badgeSrc } from '@/components/ui/ClanBadge';
import { dstr, fmt, monthStr } from '../format';
import type { ClanRecap } from './clan';
import type { PlayerRecap, RecapPol } from './player';

/**
 * Recap images (1080×1350, the portrait size phones share best) in the Obsidian theme. Satori
 * draws flexbox only, so every box with more than one child sets display: flex.
 */

export const RECAP_SIZE = { width: 1080, height: 1350 };

const C = {
  void: '#07080a',
  obsidian: '#1a1c20',
  hair: 'rgba(255,255,255,0.1)',
  text1: '#f3f4f6',
  text2: '#a4a9b4',
  text3: '#80868f',
  blue: '#3aa0ff',
  blueHi: '#8ccbff',
  gold: '#e6b34a',
  ember: '#ff5464',
  streak: '#ffb35c',
};

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: 'normal' }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all(
    (
      [
        ['JetBrainsMono-Medium.ttf', 500],
        ['JetBrainsMono-ExtraBold.ttf', 800],
      ] as const
    ).map(async ([file, weight]) => ({ name: 'JetBrains Mono', data: await readFile(join(process.cwd(), 'assets/fonts', file)), weight, style: 'normal' as const })),
  );
  return fonts;
}

const ART_HOST = 'api-assets.clashroyale.com';

/**
 * Art as a data URI: our own files from public/, the official CDN with a short timeout.
 * Anything missing or slow is left out rather than failing the image.
 */
async function art(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    if (src.startsWith('/') && !src.includes('..')) {
      const buf = await readFile(join(process.cwd(), 'public', src));
      return `data:image/png;base64,${buf.toString('base64')}`;
    }
    const u = new URL(src);
    if (u.protocol !== 'https:' || u.hostname !== ART_HOST) return null;
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    return `data:${r.headers.get('content-type') ?? 'image/png'};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

const label: CSSProperties = { fontSize: 18, fontWeight: 500, letterSpacing: 3, color: C.text3, textTransform: 'uppercase' };

function Tile({ k, v, sub, fg, style, children }: { k: string; v?: string; sub?: string; fg?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '22px 24px',
        background: 'rgba(26,28,32,0.82)',
        border: `1px solid ${C.hair}`,
        borderRadius: 8,
        ...style,
      }}
    >
      <div style={label}>{k}</div>
      {v != null && <div style={{ display: 'flex', fontSize: v.length > 9 ? 36 : 50, fontWeight: 800, lineHeight: 1.05, color: fg ?? C.text1 }}>{v}</div>}
      {children}
      {sub && <div style={{ fontSize: 17, color: C.text3, letterSpacing: 1 }}>{sub}</div>}
    </div>
  );
}

function Frame({ kicker, host, path, generatedAt, children }: { kicker: string; host: string; path: string; generatedAt: string; children: ReactNode }) {
  const at = new Date(generatedAt);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 60,
        fontFamily: 'JetBrains Mono',
        color: C.text1,
        backgroundColor: C.void,
        backgroundImage: 'radial-gradient(circle at 88% 12%, rgba(58,160,255,0.28), rgba(58,160,255,0) 46%), radial-gradient(circle at 0% 100%, rgba(10,72,201,0.22), rgba(10,72,201,0) 50%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 20, fontWeight: 800, letterSpacing: 5, color: C.blueHi }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: C.blue, boxShadow: `0 0 14px ${C.blue}` }} />
          CR CLAN TRACKER
        </div>
        <div style={{ ...label, fontSize: 18 }}>{kicker}</div>
      </div>
      {children}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: `1px solid ${C.hair}`, fontSize: 17, color: C.text3 }}>
        <div style={{ color: C.text2 }}>{`${host}${path}`}</div>
        <div>{`Official API data · ${dstr(at)} ${at.toISOString().slice(11, 16)} UTC`}</div>
      </div>
    </div>
  );
}

function polText(x: RecapPol, none: string): { v: string; sub: string } {
  if (!x) return { v: '—', sub: none };
  if (x.rating != null) return { v: fmt(x.rating), sub: `${x.leagueName}${x.rank ? ` · #${fmt(x.rank)}` : ''}` };
  return { v: x.leagueName, sub: x.rank ? `#${fmt(x.rank)}` : x.league != null ? `LEAGUE ${x.league} OF 7` : 'PATH OF LEGENDS' };
}

const nameSize = (n: string) => (n.length <= 9 ? 104 : n.length <= 13 ? 84 : n.length <= 17 ? 66 : 54);

export async function playerRecapImage(r: PlayerRecap, host: string) {
  const [fontData, fav, mastery, ...deck] = await Promise.all([loadFonts(), art(r.favourite?.img), art(r.mastery?.img), ...(r.deck?.cards ?? []).map((c) => art(c.img))]);
  const cur = polText(r.pol.current, 'NOT PLAYED THIS SEASON');
  const best = polText(r.pol.best, 'NO SEASON YET');
  const kicker = r.season ? `SEASON RECAP · ${monthStr(r.season).toUpperCase()}` : 'PLAYER RECAP';

  return new ImageResponse(
    (
      <Frame kicker={kicker} host={host} path={`/player/${r.tag}`} generatedAt={r.generatedAt}>
        <div style={{ display: 'flex', height: 360, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 18, width: 640, paddingBottom: 8 }}>
            <div style={{ display: 'flex', fontSize: nameSize(r.name), fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>{r.name}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 22, color: C.text2 }}>
              <span>{`#${r.tag}`}</span>
              {r.clan && <span style={{ color: C.text3 }}>·</span>}
              {r.clan && <span>{r.clan}</span>}
            </div>
          </div>
          {r.favourite && (
            <div style={{ position: 'absolute', right: -20, top: -10, width: 400, height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              {fav && <img src={fav} width={340} height={340} style={{ objectFit: 'contain' }} alt="" />}
              <div style={{ ...label, fontSize: 16, color: C.blueHi }}>{`FAVOURITE · ${r.favourite.name}`}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <Tile k={r.trophies.seasonal ? 'Season trophies' : 'Trophies'} v={fmt(r.trophies.value)} sub={`${r.trophies.seasonal ? 'SEASON BEST' : 'BEST'} ${fmt(r.trophies.best)}`} style={{ width: 309 }} />
          <Tile k="Path of Legends" v={cur.v} sub={cur.sub.toUpperCase()} style={{ width: 309 }} />
          <Tile k="Best PoL season" v={best.v} sub={best.sub.toUpperCase()} style={{ width: 309 }} />
          <Tile k="Wins · career" v={fmt(r.career.wins)} sub={r.career.winRate != null ? `${r.career.winRate.toFixed(1)}% WIN RATE` : undefined} style={{ width: 309 }} />
          <Tile
            k="Best win streak"
            v={r.logBattles ? String(r.bestRun) : '—'}
            fg={r.bestRun ? C.streak : C.text1}
            sub={r.logBattles ? `IN LAST ${r.logBattles} BATTLES` : 'BATTLE LOG UNAVAILABLE'}
            style={{ width: 309 }}
          />
          <Tile
            k="Playstyle"
            v={r.style.main ?? '—'}
            sub={r.style.main && r.style.lean != null ? `${Math.round(r.style.lean * 100)}% LEAN · ${fmt(r.style.games)} GAMES` : 'NOT ENOUGH GAMES STORED YET'}
            style={{ width: 309 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Tile
            k={r.deck?.label === 'most' ? 'Most played deck' : 'Current deck'}
            sub={r.deck?.label === 'most' ? `${r.deck.wins} WINS IN ${r.deck.games} GAMES · LAST ${r.logBattles} BATTLES` : r.deck ? 'NO DECK PLAYED TWICE IN THE BATTLE LOG' : undefined}
            style={{ width: 634 }}
          >
            {r.deck ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, color: C.blueHi }}>{r.deck.name}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {deck.map((src, i) =>
                    src ? <img key={i} src={src} width={68} height={82} style={{ objectFit: 'contain' }} alt="" /> : <div key={i} style={{ width: 68, height: 82, border: `1px dashed ${C.hair}`, borderRadius: 6 }} />,
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', fontSize: 24, color: C.text3 }}>No deck in the battle log</div>
            )}
          </Tile>
          <Tile k="Top mastery" style={{ width: 309 }} sub={r.mastery ? `LEVEL ${r.mastery.level} / ${r.mastery.maxLevel}` : 'NONE YET'}>
            {r.mastery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {mastery && <img src={mastery} width={74} height={89} style={{ objectFit: 'contain' }} alt="" />}
                <div style={{ display: 'flex', fontSize: r.mastery.name.length > 12 ? 22 : 28, fontWeight: 800, width: 160 }}>{r.mastery.name}</div>
              </div>
            )}
          </Tile>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 21, color: C.text2, minHeight: 30 }}>
          {r.tracked ? (
            <>
              <span style={{ ...label, fontSize: 18, color: C.blueHi }}>{`Since ${dstr(new Date(r.tracked.since))}`}</span>
              <span>{`+${fmt(r.tracked.wins)} wins · ${fmt(r.tracked.battles)} battles`}</span>
            </>
          ) : r.trackedSince ? (
            <span style={{ color: C.text3 }}>{`Tracked daily since ${dstr(new Date(r.trackedSince))}: changes show from the next snapshot`}</span>
          ) : null}
        </div>
      </Frame>
    ),
    { ...RECAP_SIZE, fonts: await fontData },
  );
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

export async function clanRecapImage(r: ClanRecap, host: string) {
  const [fontData, badge] = await Promise.all([loadFonts(), art(badgeSrc(r.badgeId))]);
  const n = r.races.length;
  const trophyMove = r.races.reduce((a, x) => a + (x.trophyChange ?? 0), 0);
  const maxFame = Math.max(1, ...r.performers.map((p) => p.fame));
  const nameFs = r.name.length <= 10 ? 88 : r.name.length <= 15 ? 70 : 56;
  const races = [...r.races].reverse(); // oldest → newest, left to right

  return new ImageResponse(
    (
      <Frame kicker={n ? `CLAN RECAP · LAST ${n} RIVER RACES` : 'CLAN RECAP'} host={host} path={`/clan/${r.tag}`} generatedAt={r.generatedAt}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {badge ? <img src={badge} width={150} height={168} style={{ objectFit: 'contain' }} alt="" /> : <div style={{ width: 150, height: 168 }} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 790 }}>
            <div style={{ display: 'flex', fontSize: nameFs, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>{r.name}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 22, color: C.text2 }}>
              <span>{`#${r.tag}`}</span>
              <span style={{ color: C.text3 }}>·</span>
              <span>{`${r.members} members`}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={label}>{n ? 'River race finishes · oldest → newest' : 'River race finishes'}</div>
          {n ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {races.map((x, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    width: 88,
                    padding: '14px 0',
                    borderRadius: 8,
                    background: x.rank === 1 ? 'rgba(230,179,74,0.14)' : 'rgba(26,28,32,0.82)',
                    border: `1px solid ${x.rank === 1 ? 'rgba(230,179,74,0.6)' : C.hair}`,
                  }}
                >
                  <div style={{ fontSize: 34, fontWeight: 800, color: x.rank === 1 ? C.gold : C.text1 }}>{x.rank ? ordinal(x.rank) : '—'}</div>
                  <div style={{ fontSize: 13, color: C.text3 }}>{x.label.replace(' · ', ' ')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 24, color: C.text3 }}>No river races in the API&apos;s race log</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Tile k="Total fame" v={fmt(r.totalFame)} sub={`LAST ${n} RACES`} style={{ width: 309 }} />
          <Tile k="Race wins" v={`${r.wins} / ${n}`} fg={r.wins ? C.gold : C.text1} sub="1ST PLACE FINISHES" style={{ width: 309 }} />
          <Tile k="War trophies" v={fmt(r.warTrophies)} sub={n ? `${trophyMove >= 0 ? '+' : ''}${fmt(trophyMove)} OVER ${n} RACES` : undefined} style={{ width: 309 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={label}>{`Top war performers · fame · current members`}</div>
          {r.performers.length ? (
            r.performers.map((p, i) => (
              <div key={p.name + i} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 40 }}>
                <div style={{ display: 'flex', width: 30, fontSize: 22, fontWeight: 800, color: i === 0 ? C.gold : C.text3 }}>{String(i + 1)}</div>
                <div style={{ display: 'flex', width: 300, fontSize: 24, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ display: 'flex', width: 300, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${Math.max(2, (p.fame / maxFame) * 100)}%`, height: 10, borderRadius: 5, background: C.blue, boxShadow: `0 0 12px rgba(58,160,255,0.6)` }} />
                </div>
                <div style={{ display: 'flex', width: 130, justifyContent: 'flex-end', fontSize: 24, fontWeight: 800 }}>{fmt(p.fame)}</div>
                <div style={{ display: 'flex', width: 140, justifyContent: 'flex-end', fontSize: 17, color: C.text3 }}>{`${p.decks} decks`}</div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', fontSize: 22, color: C.text3 }}>No war fame from current members in the log</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Tile k="Donations leader" style={{ width: 468 }} sub={r.donations ? `${fmt(r.donations.donations)} CARDS · THIS WEEK` : 'NO DONATIONS THIS WEEK YET'}>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>{r.donations?.name ?? '—'}</div>
          </Tile>
          <Tile
            k="Roster moves"
            style={{ width: 468 }}
            sub={r.roster ? `SINCE ${dstr(new Date(r.roster.since)).toUpperCase()}` : 'NO SNAPSHOTS OF THIS CLAN YET'}
          >
            {r.roster ? (
              <div style={{ display: 'flex', gap: 28, fontSize: 34, fontWeight: 800 }}>
                <span style={{ color: C.blueHi }}>{`${r.roster.joined}${r.roster.complete ? '' : '+'} joined`}</span>
                <span style={{ color: C.ember }}>{`${r.roster.left}${r.roster.complete ? '' : '+'} left`}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, color: C.text3 }}>—</div>
            )}
          </Tile>
        </div>
      </Frame>
    ),
    { ...RECAP_SIZE, fonts: await fontData },
  );
}
