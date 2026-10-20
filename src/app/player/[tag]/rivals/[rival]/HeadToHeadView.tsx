'use client';

import Link from 'next/link';
import { Suspense, use } from 'react';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { LeagueIcon, PolRating } from '@/components/ui/primitives';
import type { EventRank } from '@/lib/events';
import { agoShort, dstr, fmt } from '@/lib/format';
import { polLabel } from '@/lib/leagues';
import { setRival, useMyRivals } from '@/lib/myRivals';
import type { BattleKind, PlayerProfile } from '@/lib/player/profile';
import type { H2HGame } from '@/lib/player/rivals';
import { BattleKindIcon, KIND_LABEL } from '../../BattleKindIcon';
import ps from '../../player.module.css';
import s from './h2h.module.css';

type Pol = PlayerProfile['pol']['current'];
export type Side = {
  tag: string;
  name: string;
  clan: string | null;
  trophies: number;
  best: number;
  seasonal: boolean;
  pol: { current: Pol; best: Pol };
  recent: { id: string; kind: BattleKind; result: 'win' | 'loss' | 'draw'; crowns: [number, number]; opp: string; hours: number }[];
  character: string | null;
};

const word = (v: -1 | 0 | 1) => (v > 0 ? 'win' : v < 0 ? 'loss' : 'draw');

function PolLine({ k, x }: { k: string; x: Pol }) {
  return (
    <div className={s.stat}>
      <span className={s.statK}>{k}</span>
      {x ? (
        <span className={s.statV}>
          <LeagueIcon league={x.league} size={18} />
          {x.league >= 7 && x.rating ? <PolRating rating={x.rating} size={13} /> : polLabel(x)}
          {x.rank != null && <b className={s.rank}>#{fmt(x.rank)}</b>}
        </span>
      ) : (
        <span className={s.statV}>—</span>
      )}
    </div>
  );
}

function EventLines({ ranks }: { ranks: Promise<EventRank[]> }) {
  const list = use(ranks);
  if (!list.length) return <span className={s.muted}>No live event leaderboards.</span>;
  return (
    <>
      {list.map((e) => (
        <div key={e.id} className={s.stat}>
          <span className={s.statK}>{e.name}</span>
          <span className={s.statV}>{e.rank != null ? <b className={s.rank}>#{fmt(e.rank)}</b> : <span className={s.muted}>Not in top {fmt(e.listed)}</span>}</span>
        </div>
      ))}
    </>
  );
}

function PlayerCard({ p, ranks, us }: { p: Side; ranks: Promise<EventRank[]>; us: boolean }) {
  return (
    <section className={s.card} data-us={us}>
      <Link href={`/player/${p.tag}`} className={s.who}>
        <b>{p.name}</b>
        <small>
          #{p.tag}
          {p.clan ? ` · ${p.clan}` : ''}
        </small>
      </Link>
      <div className={s.stat}>
        <span className={s.statK}>{p.seasonal ? 'Season trophies' : 'Trophies'}</span>
        <span className={s.statV}>
          {fmt(p.trophies)} <small>{p.seasonal ? 'season best' : 'best'} {fmt(p.best)}</small>
        </span>
      </div>
      <PolLine k="Path of Legends · this season" x={p.pol.current} />
      <PolLine k="Path of Legends · best season" x={p.pol.best} />
      <span className={s.sub}>Live events</span>
      <Suspense fallback={<span className={`skeleton ${s.wait}`} />}>
        <EventLines ranks={ranks} />
      </Suspense>
      <span className={s.sub}>Recent matches</span>
      <ol className={s.recent}>
        {p.recent.map((b) => (
          <li key={b.id} data-r={b.result}>
            <BattleKindIcon kind={b.kind} size={16} />
            <span className={s.recentOpp}>vs {b.opp}</span>
            <span className={s.recentScore}>
              {b.crowns[0]}–{b.crowns[1]}
            </span>
            <span className={s.recentAgo}>{agoShort(b.hours)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Two players side by side: who's ahead in their 1v1 games, trophies, Path of Legends, live
 * event ranks and recent form. `a` is the player whose rivals these are.
 */
export function HeadToHeadView({ a, b, games, ranksA, ranksB, at }: { a: Side; b: Side; games: H2HGame[]; ranksA: Promise<EventRank[]>; ranksB: Promise<EventRank[]>; at: number }) {
  const mine = useMyRivals(a.tag);
  const added = mine.includes(b.tag);
  const wins = games.filter((g) => g.result > 0).length;
  const losses = games.filter((g) => g.result < 0).length;
  const draws = games.length - wins - losses;
  const verdict = !games.length ? 'No 1v1 games on record yet' : wins > losses ? `${a.name} leads` : wins < losses ? `${b.name} leads` : 'Level';

  return (
    <>
      <SceneHeader
        scene="/scenes/shields.jpg"
        height="clamp(340px, 44vh, 460px)"
        character={a.character}
        fog={1.1}
        extra={<div className={ps.shade} />}
        status={
          <>
            <span>Head to head</span>
            <span>{games.length ? `${games.length} 1v1 games since ${dstr(new Date(games[games.length - 1].time))}` : 'No games between them yet'}</span>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 980 }}>
          <Link href={`/player/${a.tag}/rivals`} className={ps.chip} style={{ alignSelf: 'flex-start' }}>
            ← {a.name}&apos;s rivals
          </Link>
          <Reveal as="h1" className={s.title}>
            {a.name} <span>vs</span> {b.name}
          </Reveal>
          <div className={s.score} data-lead={wins > losses ? 'us' : wins < losses ? 'them' : 'even'}>
            <b>
              {wins}–{losses}
              {draws ? `–${draws}` : ''}
            </b>
            <span>
              {verdict}
              {games.length ? ` · ${draws ? 'W–L–D' : 'W–L'} for ${a.name}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-scene" onClick={() => setRival(a.tag, b.tag, !added)}>
              {added ? '✓ In your rivals · remove' : '+ Add to rivals'}
            </button>
            <Link href={`/compare?type=player&tags=${a.tag},${b.tag}`} className="btn btn-scene">
              Compare ⇄
            </Link>
          </div>
        </div>
      </SceneHeader>

      <main className={s.main}>
        <div className={s.sides}>
          <PlayerCard p={a} ranks={ranksA} us />
          <PlayerCard p={b} ranks={ranksB} us={false} />
        </div>

        <section className={s.block}>
          <h2 className="heading">Every game between them</h2>
          {games.length ? (
            <ol className={s.games}>
              {games.map((g) => (
                <li key={g.time} data-r={word(g.result)}>
                  <BattleKindIcon kind={g.kind as BattleKind} size={18} />
                  <span className={s.when}>
                    {dstr(new Date(g.time))} · {agoShort((at - Date.parse(g.time)) / 3600_000)} ago
                  </span>
                  <span className={s.mode}>{KIND_LABEL[g.kind as BattleKind] ?? g.kind}</span>
                  <span className={s.gscore}>
                    {g.crowns}–{g.oppCrowns}
                  </span>
                  <span className={s.res}>{word(g.result)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={s.muted} style={{ margin: 0 }}>
              They haven&apos;t met in either player&apos;s last ~40 battles, and no earlier games are stored. Games are kept from now on, so their record builds up here.
            </p>
          )}
          <p className={s.note}>
            1v1 games only, from both players&apos; battle logs and the games this site has stored for them. War duels count by rounds won. Ranks come from the official API.
          </p>
        </section>
      </main>
    </>
  );
}
