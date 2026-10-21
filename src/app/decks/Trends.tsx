'use client';

import Link from 'next/link';
import { use } from 'react';
import { deckHref } from '@/lib/decks';
import { dstr } from '@/lib/format';
import type { ModeTrends, Trend } from '@/lib/trends';
import s from './trends.module.css';

const pp = (n: number) => `${n.toFixed(1)}%`;

function Column({ title, mark, items, mode, empty }: { title: string; mark: string; items: Trend[]; mode: string; empty: string }) {
  return (
    <div className={s.col}>
      <h3 className={s.h}>
        <span aria-hidden>{mark}</span> {title}
      </h3>
      {items.length ? (
        <ol className={s.list}>
          {items.map((t) => (
            <li key={t.key}>
              <Link href={deckHref(t.key, mode)} className={s.item} data-kind={t.kind}>
                <b>{t.name}</b>
                <span>
                  {t.useThen == null ? `${pp(t.useNow)} of decks · ${t.gamesNow} games` : `${pp(t.useThen)} → ${pp(t.useNow)} · ${t.kind === 'falling' ? t.gamesThen : t.gamesNow} games`}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={s.empty}>{empty}</p>
      )}
    </div>
  );
}

/** Rising, falling and new decks for the selected mode, against a stored day a few days back. */
export function Trends({ trends, mode }: { trends: Promise<Record<string, ModeTrends>>; mode: string }) {
  const all = use(trends);
  const t = all[mode];
  return (
    <section className={s.wrap} aria-label="Deck trends">
      <div className={s.head}>
        <h2 className="heading">Trending decks</h2>
        <span className={s.note}>{t ? `Share of decks now against ${dstr(new Date(t.since))}` : 'Needs a stored daily snapshot from at least a day ago'}</span>
      </div>
      {t ? (
        <div className={s.cols}>
          <Column title="Rising" mark="▲" items={t.rising} mode={mode} empty="Nothing climbing fast." />
          <Column title="Falling" mark="▼" items={t.falling} mode={mode} empty="Nothing dropping fast." />
          <Column title="New" mark="✦" items={t.fresh} mode={mode} empty="No new combinations with enough games." />
        </div>
      ) : (
        <p className={s.empty}>The site keeps one meta snapshot a day; trends show once there&apos;s one from a day or more ago.</p>
      )}
    </section>
  );
}
