'use client';

import { useState } from 'react';
import { TagSearch } from '@/components/TagSearch';
import { Tabs } from '@/components/ui/Tabs';

export function DesignSystemDemos() {
  const [tab, setTab] = useState<'members' | 'war' | 'roster' | 'score'>('members');
  const [chip, setChip] = useState('all');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 16 }}>
      <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Buttons</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button type="button" data-magnet="" className="btn btn-primary">
            Primary
          </button>
          <button type="button" className="btn btn-secondary">
            Secondary
          </button>
          <a href="#buttons" className="link-mono">
            Tertiary →
          </a>
        </div>
        <span style={{ font: '400 12px/1.5 var(--sans)', color: 'var(--text-3)' }}>
          Primary: magnetic pull (0.18×, 0.28×), light sweep 700ms on hover.
        </span>
      </div>
      <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Search input · tag validation</span>
        <TagSearch size="default" defaultHint="Type a tag. Try 9Q2LUY, then try an O." />
      </div>
      <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="label">Tabs · light-tube underline</span>
        <Tabs
          label="Demo"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'members', label: 'Members' },
            { key: 'war', label: 'War' },
            { key: 'roster', label: 'Roster' },
            { key: 'score', label: 'Score' },
          ]}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'active', 'at risk', 'inactive'].map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={chip === c} onClick={() => setChip(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
