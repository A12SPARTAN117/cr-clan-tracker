'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { replaceUrl } from '@/lib/urlQuery';
import { Portal } from '@/components/fx/Portal';
import { Tabs } from '@/components/ui/Tabs';
import type { Tab } from './BoardView';

export function BoardControls({
  tab,
  loc,
  ev,
  locations,
  events,
}: {
  tab: Tab;
  loc: string;
  ev: number | null;
  locations: { id: string; name: string; isCountry: boolean }[];
  events: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (next: { tab?: Tab; loc?: string; ev?: number | null }) => {
    const p = new URLSearchParams();
    const t = next.tab ?? tab;
    const l = next.loc ?? loc;
    if (t !== 'pol') p.set('tab', t);
    if (t === 'events' && (next.ev ?? ev)) p.set('ev', String(next.ev ?? ev));
    // The location is in the path, so each location's boards are their own cached page.
    const url = `/leaderboards${l === 'global' ? '' : `/${l}`}${p.size ? `?${p}` : ''}`;
    // Tabs and events are already on the page (BoardView); only a new location loads.
    if (l === loc) replaceUrl(url);
    else start(() => router.replace(url, { scroll: false }));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--hair)' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0, marginBottom: -1 }}>
          <Tabs<Tab>
            label="Leaderboard"
            value={tab}
            onChange={(t) => go({ tab: t })}
            tabs={[
              { key: 'pol', label: 'Path of Legends' },
              { key: 'clans', label: 'Clans' },
              { key: 'war', label: 'Clan wars' },
              { key: 'events', label: 'Events' },
            ]}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
          {pending && <Portal size={20} />}
          {tab !== 'events' && (
            <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              LOCATION
              <select
                value={loc}
                onChange={(e) => go({ loc: e.target.value })}
                style={{ height: 32, maxWidth: 220, padding: '0 10px', background: 'var(--obsidian)', border: '1px solid var(--hair)', borderRadius: 4, color: 'var(--text-1)', font: '500 11px/1 var(--mono)' }}
              >
                <option value="global">Global</option>
                <optgroup label="Regions">
                  {locations.filter((l) => !l.isCountry).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Countries">
                  {locations.filter((l) => l.isCountry).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
          )}
        </div>
      </div>
      {tab === 'events' && events.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {events.map((e) => (
            <button key={e.id} type="button" className="chip" aria-pressed={ev === e.id} onClick={() => go({ ev: e.id })}>
              {e.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
