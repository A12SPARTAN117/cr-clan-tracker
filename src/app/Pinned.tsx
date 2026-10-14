'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CardTile } from '@/components/CardTile';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { LeagueIcon, PolRating, ROLE_LABEL } from '@/components/ui/primitives';
import { TrophyIcon } from '@/components/ui/icons';
import { fmt } from '@/lib/format';
import { setPin, usePins } from '@/lib/pins';
import type { ClanSummary, PlayerSummary } from '@/lib/summary';
import s from './home.module.css';

function useSummary<T>(kind: 'player' | 'clan', tag: string | null) {
  const [state, setState] = useState<{ tag: string | null; data: T | null; failed: boolean }>({ tag: null, data: null, failed: false });
  useEffect(() => {
    if (!tag) return;
    let live = true;
    fetch(`/api/summary/${kind}/${tag}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: T) => live && setState({ tag, data, failed: false }))
      .catch(() => live && setState({ tag, data: null, failed: true }));
    return () => {
      live = false;
    };
  }, [kind, tag]);
  return state.tag === tag ? state : { tag, data: null, failed: false };
}

function Skeleton() {
  return (
    <div className={s.pinCard} style={{ minHeight: 122 }}>
      <span className="skeleton" style={{ width: 68, height: 78 }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="skeleton" style={{ height: 10, width: '30%' }} />
        <span className="skeleton" style={{ height: 22, width: '70%' }} />
      </span>
    </div>
  );
}

export function Pinned() {
  const pins = usePins();
  const player = useSummary<PlayerSummary>('player', pins.player);
  const clan = useSummary<ClanSummary>('clan', pins.clan);
  const any = pins.player || pins.clan;

  return (
    <section className={s.section}>
      <div className={s.sectionHead} style={{ alignItems: 'baseline' }}>
        <span className="label">01 · Pinned on this device</span>
        {any && (
          <button
            type="button"
            onClick={() => {
              setPin('player', null);
              setPin('clan', null);
            }}
            className="link-mono"
            style={{ background: 'none', border: 0, padding: 0, color: 'var(--blue)', fontSize: 10, cursor: 'pointer' }}
          >
            Unpin ×
          </button>
        )}
      </div>
      {!any ? (
        <div className={s.pinEmpty}>
          <span style={{ font: '400 15px/1.5 var(--sans)', color: 'var(--text-2)' }}>
            Pin your player and clan tag, and Home opens straight to your data. Look yourself up above, then press <b>Pin</b> on
            your profile. Stored on this device only.
          </span>
          <Link href="/players" className="btn btn-secondary" style={{ height: 40, padding: '0 16px', fontSize: 10 }}>
            Find my profile
          </Link>
        </div>
      ) : (
        <div className={s.pinGrid}>
          {pins.player &&
            (player.data ? (
              <Link href={`/player/${player.data.tag}`} data-spot="" className={s.pinCard}>
                {player.data.favourite ? (
                  <CardTile slug={player.data.favourite.slug} rarity={player.data.favourite.rarity} img={player.data.favourite.img} size="M" />
                ) : (
                  <span style={{ width: 68 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <span className="label-sm">You · player</span>
                  <span className={s.pinName}>{player.data.name}</span>
                  <span className={s.pinMeta}>
                    #{player.data.tag}
                    {player.data.role ? ` · ${ROLE_LABEL[player.data.role]}` : ''}
                    {player.data.clan ? ` · ${player.data.clan.name}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {player.data.league != null && <LeagueIcon league={player.data.league} size={26} />}
                    {player.data.rating != null ? (
                      <PolRating rating={player.data.rating} size={20} style={{ font: '700 24px/1 var(--mono)' }} />
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: '700 24px/1 var(--mono)' }}>
                        <TrophyIcon size={20} />
                        {fmt(player.data.trophies)}
                      </span>
                    )}
                  </span>
                  {player.data.streak !== 0 && (
                    <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: player.data.streak > 0 ? 'var(--blue)' : 'var(--ember)' }}>
                      {player.data.streak > 0 ? `▲ W${player.data.streak} STREAK` : `▼ L${-player.data.streak} STREAK`}
                    </span>
                  )}
                </div>
              </Link>
            ) : player.failed ? (
              <div className={s.pinEmpty}>
                <span className="label" style={{ color: 'var(--ember)' }}>
                  Couldn&apos;t load #{pins.player}
                </span>
              </div>
            ) : (
              <Skeleton />
            ))}
          {pins.clan &&
            (clan.data ? (
              <Link href={`/clan/${clan.data.tag}/manage`} data-spot="" className={s.pinCard}>
                <ClanBadge badgeId={clan.data.badgeId} size={68} name={clan.data.name} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                  <span className="label-sm">Your clan</span>
                  <span className={s.pinName}>{clan.data.name.toUpperCase()}</span>
                  <span className={s.pinMeta}>
                    #{clan.data.tag} · {clan.data.members}/50 · {clan.data.inactive} flagged inactive
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ font: '700 24px/1 var(--mono)' }}>{fmt(clan.data.fame)}</span>
                  <span style={{ font: '500 9px/1 var(--mono)', letterSpacing: '.14em', color: 'var(--text-2)' }}>
                    FAME{clan.data.raceRank ? ` · #${clan.data.raceRank} IN RACE` : ''}
                  </span>
                </div>
              </Link>
            ) : clan.failed ? (
              <div className={s.pinEmpty}>
                <span className="label" style={{ color: 'var(--ember)' }}>
                  Couldn&apos;t load clan #{pins.clan}
                </span>
              </div>
            ) : (
              <Skeleton />
            ))}
        </div>
      )}
    </section>
  );
}
