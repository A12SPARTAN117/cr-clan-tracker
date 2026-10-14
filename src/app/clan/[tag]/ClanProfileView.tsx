'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Fog } from '@/components/fx/Fog';
import { Reveal } from '@/components/fx/Reveal';
import { EmptyState } from '@/components/EmptyState';
import { ClanBadge } from '@/components/ui/ClanBadge';
import { activityOf, FitValue, ROLE_LABEL } from '@/components/ui/primitives';
import { ClockIcon, DonationIcon, ExpIcon, MembersIcon, TrophyIcon, WarTrophyIcon } from '@/components/ui/icons';
import { Tabs } from '@/components/ui/Tabs';
import type { ClanProfile } from '@/lib/clan/profile';
import { agoShort, dstr, fmt } from '@/lib/format';

type Tab = 'members' | 'war' | 'roster' | 'stats';
type SortKey = 'rank' | 'name' | 'role' | 'trophies' | 'exp' | 'don' | 'seen';
const TYPE = { open: 'Open', inviteOnly: 'Invite only', closed: 'Closed' } as const;
const ROLE_IDX = { leader: 0, coLeader: 1, elder: 2, member: 3 } as const;
const TROOPS = ['knight', 'valkyrie', 'musketeer', 'hog_rider', 'wizard', 'pekka', 'mini_pekka', 'prince', 'witch', 'giant', 'archers', 'bowler'];

export function ClanProfileView({ c }: { c: ClanProfile }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('members');
  const [sort, setSort] = useState<{ k: SortKey; d: 1 | -1 }>({ k: 'trophies', d: -1 });
  const [toast, setToast] = useState('');

  // Three troops in the fog under the shield, picked from the clan tag so they stay stable.
  const seed = [...c.tag].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const troops = [0, 1, 2].map((i) => TROOPS[(seed + i * 5) % TROOPS.length]);

  const ranked = [...c.members].sort((a, b) => b.trophies - a.trophies).map((m, i) => ({ ...m, rank: i + 1 }));
  const key: Record<SortKey, (m: (typeof ranked)[number]) => number | string> = {
    rank: (m) => m.rank,
    name: (m) => m.name.toLowerCase(),
    role: (m) => ROLE_IDX[m.role],
    trophies: (m) => m.trophies,
    exp: (m) => m.expLevel,
    don: (m) => m.donations,
    seen: (m) => m.hours,
  };
  const g = key[sort.k];
  const rows = [...ranked].sort((a, b) => ((g(a) < g(b) ? -1 : g(a) > g(b) ? 1 : 0) * sort.d) || a.rank - b.rank);
  const cols: [SortKey, string, 'left' | 'right', React.ReactNode?][] = [
    ['rank', '#', 'left'],
    ['name', 'NAME', 'left'],
    ['role', 'ROLE', 'left'],
    ['trophies', 'TROPHIES', 'right', <TrophyIcon key="i" size={12} />],
    ['exp', 'KING LVL', 'right', <ExpIcon key="i" size={12} />],
    ['don', 'DON. / WK', 'right', <DonationIcon key="i" size={12} />],
    ['seen', 'LAST SEEN', 'right', <ClockIcon key="i" size={12} />],
  ];

  const n = c.members.length;
  const avgTr = n ? Math.round(c.members.reduce((a, m) => a + m.trophies, 0) / n) : 0;
  const top = ranked[0];
  const won = c.past.filter((p) => p.rank === 1).length;
  const finishes = c.past.filter((p) => p.rank != null);
  const avgFinish = finishes.length ? finishes.reduce((a, p) => a + (p.rank ?? 0), 0) / finishes.length : null;
  const avgFame = c.past.length ? Math.round(c.past.reduce((a, p) => a + p.fame, 0) / c.past.length) : null;
  const maxPastFame = Math.max(1, ...c.past.map((p) => p.fame));

  const flash = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(''), 1600);
  };

  return (
    <>
      <section style={{ position: 'relative', minHeight: 'clamp(480px,55vh,620px)', overflow: 'hidden', background: '#07080A', color: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(/scenes/shields.jpg) center/cover', filter: 'grayscale(1) contrast(1.1) brightness(.55)' }} />
        <div style={{ position: 'absolute', left: '18%', top: '20%', width: 160, height: 240, background: 'radial-gradient(closest-side,rgba(255,180,90,.18),transparent)', animation: 'oaFlicker 2.6s infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '18%', top: '24%', width: 160, height: 240, background: 'radial-gradient(closest-side,rgba(255,180,90,.16),transparent)', animation: 'oaFlicker 3.1s infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', top: '9%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
          <span style={{ width: 1, height: 46, background: 'linear-gradient(#62676F,#A4A9B4)' }} />
          <div
            style={{
              width: 'clamp(120px,13vw,180px)',
              height: 'clamp(140px,15vw,210px)',
              padding: 14,
              border: '1px solid rgba(140,203,255,.6)',
              borderRadius: '8px 8px 50% 50% / 8px 8px 30% 30%',
              background: 'rgba(7,8,10,.5)',
              boxShadow: '0 0 40px rgba(58,160,255,.35),inset 0 0 30px rgba(58,160,255,.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ClanBadge badgeId={c.badgeId} size={110} name={c.name} />
          </div>
        </div>
        <div
          aria-hidden
          style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', height: '30%', display: 'flex', justifyContent: 'center', gap: '6%', filter: 'grayscale(1) brightness(.5) drop-shadow(0 0 20px rgba(58,160,255,.4))', opacity: 0.7, pointerEvents: 'none' }}
        >
          {troops.map((t) => (
            <div key={t} style={{ width: '12%', height: '100%', background: `url(/characters/${t}.png) bottom center/contain no-repeat` }} />
          ))}
        </div>
        <Fog density={1.2} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom,rgba(7,8,10,.4) 0%,rgba(7,8,10,0) 30%,rgba(7,8,10,.6) 62%,#07080A 100%),radial-gradient(ellipse at center,rgba(7,8,10,0) 40%,rgba(7,8,10,.7) 100%)',
          }}
        />
        <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(255,255,255,.55)', borderRadius: 4, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', flex: 1, width: '100%', maxWidth: 1440, margin: '0 auto', padding: '36px clamp(28px,4vw,64px) 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', font: '500 10px/1.4 var(--mono)', letterSpacing: '.14em', color: '#A4A9B4', textTransform: 'uppercase' }}>
            {c.race && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F3F4F6' }}>
                <span className="live-dot" />
                Live · River race · {c.race.label}
              </span>
            )}
            {c.history && <span>Tracked since {dstr(new Date(c.history.trackedSince))}</span>}
            <span>Last sync {c.generatedAt.slice(11, 16)} UTC</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
              <Reveal as="h1" style={{ margin: 0, font: '800 clamp(42px,8.4vw,132px)/.86 var(--mono)', letterSpacing: '-.055em', overflowWrap: 'anywhere' }}>
                {c.name.toUpperCase()}
              </Reveal>
              {c.description && <p style={{ margin: 0, maxWidth: 560, font: '400 15px/1.55 var(--sans)', color: '#A4A9B4', textWrap: 'pretty', overflowWrap: 'anywhere' }}>{c.description}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', font: '500 11px/1 var(--mono)', letterSpacing: '.12em', color: '#A4A9B4', textTransform: 'uppercase' }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`#${c.tag}`).catch(() => {});
                    flash('TAG COPIED');
                  }}
                  style={{ display: 'flex', gap: 8, background: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 4, padding: '5px 8px', color: '#F3F4F6', font: 'inherit', letterSpacing: 'inherit', cursor: 'pointer' }}
                >
                  #{c.tag} <span style={{ color: '#80868F' }}>COPY</span>
                </button>
                {c.location && <span style={{ padding: '5px 0' }}>{c.location}</span>}
                <span style={{ padding: '5px 0' }}>{TYPE[c.type]}</span>
              </div>
            </div>
            <Link
              href={`/clan/${c.tag}/manage`}
              data-magnet=""
              className="btn btn-primary"
              style={{
                height: 56,
                padding: '0 26px',
                fontSize: 12,
                background: 'linear-gradient(110deg,#F3F4F6 40%,#fff 50%,#F3F4F6 60%) 120% 0/250% 100%',
                color: '#07080A',
                boxShadow: '0 0 0 1px rgba(58,160,255,.5),0 0 30px rgba(58,160,255,.3)',
              }}
            >
              Manage this clan →
            </Link>
          </div>
        </div>
      </section>

      <main style={{ position: 'relative', maxWidth: 1440, margin: '0 auto', padding: '0 var(--gutter) 80px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 1, background: 'var(--hair)', border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden', marginTop: -20 }}>
          {(
            [
              ['CLAN SCORE', fmt(c.clanScore), '', <TrophyIcon key="i" title="Clan score" />],
              ['WAR TROPHIES', fmt(c.clanWarTrophies), '', <WarTrophyIcon key="i" title="Clan war trophies" />],
              ['REQUIRED', fmt(c.requiredTrophies), 'TR', <TrophyIcon key="i" title="Required trophies" />],
              ['DONATIONS / WK', fmt(c.donationsPerWeek), '', <DonationIcon key="i" title="Cards donated this week" />],
              ['MEMBERS', String(n), '/50', <MembersIcon key="i" title="Members" />],
              ['TYPE', TYPE[c.type].split(' ')[0].toUpperCase(), '', null],
            ] as const
          ).map(([k, v, sub, icon]) => (
            <div key={k} data-spot="" className="spot" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 18px', minWidth: 0 }}>
              <span style={{ font: '500 10px/1.2 var(--mono)', letterSpacing: '.12em', color: 'var(--text-3)' }}>{k}</span>
              <FitValue value={v} unit={sub || undefined} icon={icon ?? undefined} max={30} />
            </div>
          ))}
        </div>

        <Tabs<Tab>
          label="Clan sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'members', label: 'Members', count: n },
            { key: 'war', label: 'War' },
            { key: 'roster', label: 'Roster changes' },
            { key: 'stats', label: 'Stats' },
          ]}
        />

        {tab === 'members' && (
          <div style={{ overflowX: 'auto', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
            <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr>
                  {cols.map(([k, label, al, icon]) => {
                    const on = sort.k === k;
                    return (
                      <th key={k} aria-sort={on ? (sort.d < 0 ? 'descending' : 'ascending') : 'none'} style={{ padding: 0, background: 'var(--glass)', borderBottom: '1px solid var(--hair)', textAlign: al }}>
                        <button
                          type="button"
                          onClick={() => setSort((st) => ({ k, d: st.k === k ? ((-st.d) as 1 | -1) : k === 'name' || k === 'rank' || k === 'role' || k === 'seen' ? 1 : -1 }))}
                          style={{ width: '100%', height: 42, padding: '0 14px', background: 'none', border: 0, cursor: 'pointer', textAlign: al, font: '500 10px/1 var(--mono)', letterSpacing: '.12em', color: on ? 'var(--text-1)' : 'var(--text-3)' }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {icon}
                            {label}
                            <span style={{ color: 'var(--blue)' }}>{on ? (sort.d < 0 ? '▼' : '▲') : ''}</span>
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const a = activityOf(m.hours);
                  return (
                    <tr
                      key={m.tag}
                      tabIndex={0}
                      className="oa-row"
                      onClick={() => router.push(`/player/${m.tag}`)}
                      onKeyDown={(e) => e.key === 'Enter' && router.push(`/player/${m.tag}`)}
                    >
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', font: '500 12px/1 var(--mono)', color: 'var(--text-3)' }}>{String(m.rank).padStart(2, '0')}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', font: '600 14px/1.2 var(--sans)' }}>{m.name}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', font: '500 10px/1 var(--mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: m.role === 'leader' ? 'var(--gold)' : m.role === 'member' ? 'var(--text-2)' : 'var(--text-1)' }}>
                        {ROLE_LABEL[m.role]}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 13px/1 var(--mono)' }}>{fmt(m.trophies)}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 13px/1 var(--mono)' }}>{m.expLevel || '—'}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 13px/1 var(--mono)' }}>{fmt(m.donations)}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--hair)', textAlign: 'right', font: '500 12px/1 var(--mono)', color: a === 'active' ? 'var(--blue)' : a === 'risk' ? 'var(--text-2)' : 'var(--ember)' }}>
                        {a === 'active' ? '● ' : a === 'risk' ? '◐ ' : '○ '}
                        {agoShort(m.hours)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'war' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,440px),1fr))', gap: 20 }}>
            <div className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label" style={{ letterSpacing: '.14em', marginBottom: 10 }}>
                Current river race{c.race ? ` · ${c.race.label}` : ''}
              </span>
              {c.race?.training && (
                <div className="data-since" role="note" style={{ marginBottom: 10 }}>
                  River race in progress: training days. Training battles are practice and don&apos;t count as war. War starts{' '}
                  {new Date(c.race.warStarts).toUTCString().slice(0, 11)} at {new Date(c.race.warStarts).toISOString().slice(11, 16)} UTC.
                </div>
              )}
              {c.race ? (
                c.race.clans.map((r, i) => {
                  const max = Math.max(10000, ...c.race!.clans.map((x) => x.fame));
                  return (
                    <div key={r.tag} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px', gap: 12, alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--hair)' }}>
                      <span style={{ font: '700 13px/1 var(--mono)', color: i === 0 ? 'var(--gold)' : 'var(--text-3)' }}>{i + 1}</span>
                      <Link href={`/clan/${r.tag}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, color: r.us ? 'var(--text-1)' : 'var(--text-2)' }}>
                        <span style={{ font: '600 14px/1 var(--sans)' }}>{r.name}</span>
                        <span style={{ height: 2, background: 'var(--hair)' }}>
                          <span style={{ display: 'block', height: '100%', width: `${(r.fame / max) * 100}%`, background: r.us ? '#8CCBFF' : 'var(--text-3)', boxShadow: r.us ? '0 0 8px rgba(58,160,255,.8)' : 'none' }} />
                        </span>
                      </Link>
                      <span style={{ textAlign: 'right', font: '600 13px/1 var(--mono)' }}>{fmt(r.fame)}</span>
                    </div>
                  );
                })
              ) : (
                <p className="body">No race data right now.</p>
              )}
            </div>
            <div className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="label" style={{ letterSpacing: '.14em', marginBottom: 10 }}>
                Last {c.past.length || 10} races
              </span>
              {c.past.length ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
                    {[...c.past].reverse().map((p) => (
                      <div key={p.label} title={`${p.label}: ${fmt(p.fame)} fame`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: '700 10px/1 var(--mono)', color: p.rank === 1 ? 'var(--gold)' : 'var(--text-2)' }}>{p.rank ? `#${p.rank}` : '—'}</span>
                        <span
                          style={{
                            width: '100%',
                            height: Math.max(4, Math.round((p.fame / maxPastFame) * 110)),
                            borderRadius: '3px 3px 0 0',
                            background: p.rank === 1 ? 'rgba(58,160,255,.85)' : 'var(--slate)',
                            boxShadow: p.rank === 1 ? '0 0 12px rgba(58,160,255,.5)' : 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <span style={{ font: '500 10px/1.4 var(--mono)', color: 'var(--text-3)' }}>Bar = fame. Number = finishing place. Oldest on the left.</span>
                </>
              ) : (
                <p className="body">This clan has no recent river races.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'roster' &&
          (c.history?.events.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
              {c.history.events.map((e, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 22px 1fr', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--hair)' }}>
                  <span style={{ font: '500 11px/1 var(--mono)', color: 'var(--text-3)' }}>{dstr(new Date(e.at)).slice(0, 6)}</span>
                  <span style={{ font: '700 9px/1 var(--mono)' }}>{e.kind === 'joined' ? '+' : e.kind === 'left' ? '−' : e.kind === 'kicked' ? '×' : e.kind === 'promoted' ? '▲' : '▼'}</span>
                  <span style={{ font: '500 14px/1.3 var(--sans)' }}>
                    <b style={{ fontWeight: 600 }}>{e.name}</b> {e.kind} {e.detail ?? ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="data-since">Roster changes are tracked from the first snapshot of this clan. Open the dashboard to see former members from recent races.</div>
              <EmptyState text="No tracked roster changes yet." />
            </div>
          ))}

        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16 }}>
            {[
              {
                t: 'ACTIVITY',
                rows: [
                  ['Active 24h', String(c.members.filter((m) => m.hours < 24).length)],
                  ['Active 7 days', String(c.members.filter((m) => m.hours < 168).length)],
                  ['Donations this week', fmt(c.members.reduce((a, m) => a + m.donations, 0))],
                  ['Inactive 3+ days', String(c.members.filter((m) => m.hours >= 72).length)],
                ],
              },
              {
                t: 'WAR',
                rows: [
                  [`Races won (last ${c.past.length})`, c.past.length ? String(won) : '—'],
                  ['Avg. finish', avgFinish ? avgFinish.toFixed(1) : '—'],
                  ['Avg. weekly fame', fmt(avgFame)],
                  ['War trophies', fmt(c.clanWarTrophies)],
                ],
              },
              {
                t: 'TROPHIES',
                rows: [
                  ['Average', fmt(avgTr)],
                  ['Highest', top ? `${top.name} · ${fmt(top.trophies)}` : '—'],
                  ['Required', fmt(c.requiredTrophies)],
                  ['Clan score', fmt(c.clanScore)],
                ],
              },
            ].map((sec) => (
              <div key={sec.t} className="panel" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: '500 10px/1 var(--mono)', letterSpacing: '.16em', color: 'var(--blue-hi)', marginBottom: 14 }}>{sec.t}</span>
                {sec.rows.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--hair)' }}>
                    <span style={{ font: '400 14px/1.2 var(--sans)', color: 'var(--text-2)' }}>{k}</span>
                    <span style={{ font: '600 14px/1.2 var(--mono)', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
      {toast && (
        <div role="status" style={{ position: 'fixed', left: '50%', bottom: 84, transform: 'translateX(-50%)', zIndex: 100, padding: '12px 18px', background: 'var(--obsidian)', border: '1px solid rgba(58,160,255,.6)', borderRadius: 6, boxShadow: '0 0 18px rgba(58,160,255,.35)', font: '500 11px/1 var(--mono)', letterSpacing: '.12em' }}>
          {toast}
        </div>
      )}
    </>
  );
}
