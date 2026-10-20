'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { agoShort, dstr } from '@/lib/format';
import type { BattleKind } from '@/lib/player/profile';
import type { Rival, Rivals } from '@/lib/player/rivals';
import { BattleKindIcon, KIND_LABEL } from '../BattleKindIcon';
import ps from '../player.module.css';
import s from './rivals.module.css';

const label = (k: string) => KIND_LABEL[k as BattleKind] ?? k;
const word = (v: -1 | 0 | 1) => (v > 0 ? 'win' : v < 0 ? 'loss' : 'draw');
const pct = (x: Rival) => (x.wins + x.losses ? x.wins / (x.wins + x.losses) : 0.5);

/** One rival: the record at a glance; open it for every game between them. */
function RivalRow({ x, me, at, open, onToggle }: { x: Rival; me: string; at: number; open: boolean; onToggle: () => void }) {
  return (
    <li className={s.item} data-open={open}>
      <button type="button" className={s.row} aria-expanded={open} onClick={onToggle}>
        <span className={s.who}>
          <b>{x.name}</b>
          <small>
            {x.clan ?? 'No clan'} · {x.kinds.map(label).join(', ')} · last {agoShort((at - Date.parse(x.lastMet)) / 3600_000)} ago
          </small>
        </span>
        <span className={s.strip} aria-label={`Results, newest first: ${x.results.map(word).join(', ')}`}>
          {x.results.slice(0, 12).map((v, i) => (
            <i key={i} data-r={word(v)} />
          ))}
        </span>
        <span className={s.record} data-lead={x.wins > x.losses ? 'us' : x.wins < x.losses ? 'them' : 'even'}>
          {x.wins}–{x.losses}
          {x.draws ? `–${x.draws}` : ''}
          <small>
            {x.draws ? 'W–L–D' : 'W–L'} · {x.games} games
          </small>
        </span>
        <span className={s.chev} aria-hidden>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className={s.detail}>
          <ol className={s.games}>
            {x.log.map((g) => (
              <li key={g.time} data-r={word(g.result)}>
                <BattleKindIcon kind={g.kind as BattleKind} size={18} />
                <span className={s.when}>{dstr(new Date(g.time))}</span>
                <span className={s.mode}>{label(g.kind)}</span>
                <span className={s.score}>
                  {g.crowns}–{g.oppCrowns}
                </span>
                <span className={s.res}>{word(g.result).toUpperCase()}</span>
              </li>
            ))}
          </ol>
          <div className={s.links}>
            <Link href={`/player/${x.tag}`} className="link-mono">
              {x.name}&apos;s profile →
            </Link>
            <Link href={`/compare?type=player&tags=${me},${x.tag}`} className="link-mono">
              Compare ⇄
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Rivals: every opponent a player has met more than once, with the head-to-head record. The API's
 * battle log only holds ~40 battles, so games are stored from the first time a profile is opened.
 */
export function RivalsView({ name, tag, character, rivals, logSize, at }: { name: string; tag: string; character: string | null; rivals: Rivals; logSize: number; at: number }) {
  const [open, setOpen] = useState<string | null>(rivals.rivals[0]?.tag ?? null);
  const r = rivals.rivals;
  const wins = r.reduce((a, x) => a + x.wins, 0);
  const losses = r.reduce((a, x) => a + x.losses, 0);
  // Toughest and best matchups only count rivals with enough games to mean something.
  const ranked = r.filter((x) => x.games >= 3);
  const toughest = [...ranked].sort((a, b) => pct(a) - pct(b) || b.games - a.games)[0];
  const best = [...ranked].sort((a, b) => pct(b) - pct(a) || b.games - a.games)[0];
  const facts: [string, string, string?][] = [
    ['RIVALS', String(r.length), 'met 2+ times'],
    ['RECORD VS RIVALS', r.length ? `${wins}–${losses}` : '—', r.length ? 'W–L' : undefined],
    ['TOUGHEST', toughest && pct(toughest) < 0.5 ? toughest.name : '—', toughest && pct(toughest) < 0.5 ? `${toughest.wins}–${toughest.losses}` : undefined],
    ['BEST MATCHUP', best && pct(best) > 0.5 ? best.name : '—', best && pct(best) > 0.5 ? `${best.wins}–${best.losses}` : undefined],
  ];

  return (
    <>
      <SceneHeader
        scene="/scenes/player-knight.jpg"
        sceneFilter="contrast(1.05) brightness(0.8)"
        scenePosition="right top"
        height="clamp(360px, 46vh, 480px)"
        character={character}
        fog={1.2}
        extra={<div className={ps.shade} />}
        status={
          <>
            <span>
              {rivals.games} 1v1 games on record{rivals.since ? ` since ${dstr(new Date(rivals.since))}` : ''}
            </span>
            <span>{rivals.opponents} different opponents</span>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 880 }}>
          <Link href={`/player/${tag}`} className={ps.chip} style={{ alignSelf: 'flex-start' }}>
            ← {name} <span style={{ color: 'var(--text-3)' }}>#{tag}</span>
          </Link>
          <Reveal as="h1" className={ps.name}>
            RIVALS
          </Reveal>
          <div className={ps.facts}>
            {facts.map(([k, v, sub]) => (
              <div key={k} className={ps.fact}>
                <span className={ps.factK}>{k}</span>
                <span className={ps.factV} style={{ minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  {sub && <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{sub}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SceneHeader>

      <main className={s.main}>
        {r.length ? (
          <ol className={s.list} aria-label="Rivals, most games first">
            {r.map((x) => (
              <RivalRow key={x.tag} x={x} me={tag} at={at} open={open === x.tag} onToggle={() => setOpen(open === x.tag ? null : x.tag)} />
            ))}
          </ol>
        ) : (
          <div className={s.empty}>
            <b>No rivals yet</b>
            <span>
              Nobody shows up twice in {name}&apos;s last {logSize} battles. From today their 1v1 games are kept, so rivals appear here as they meet the same players again.
            </span>
          </div>
        )}
        <p className={s.note}>
          Counts 1v1 games only: ladder, ranked, war battles and duels (decided by rounds won), friendlies, challenges and tournaments. 2v2 and boat battles have no single opponent. The
          official API keeps a player&apos;s last ~40 battles; older games are here because this site stored them when the profile was opened, or in its daily snapshot.
        </p>
      </main>
    </>
  );
}
