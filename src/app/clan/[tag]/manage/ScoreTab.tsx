'use client';

import { DEFAULT_WEIGHTS, FACTORS, FACTOR_INFO, weightSum, type Weights } from '@/lib/clan/score';
import type { Scored } from './shared';
import s from './dashboard.module.css';

export function ScoreTab({ clanName, members, weights, onChange }: { clanName: string; members: Scored[]; weights: Weights; onChange: (w: Weights | null) => void }) {
  const sw = weightSum(weights);
  const top = [...members].sort((a, b) => a.rank - b.rank).slice(0, 12);
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))', gap: 28, alignItems: 'start' }}>
      <div className="panel ticks" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="label" style={{ letterSpacing: '.14em' }}>
            Asset score weights
          </span>
          <h2 style={{ margin: 0, font: '600 24px/1.2 var(--sans)' }}>What makes a member valuable to {clanName}</h2>
          <p className="body" style={{ fontSize: 14, lineHeight: 1.5 }}>
            Each member gets 0–100 per factor. The score is the weighted average. Weights are saved on this device only.
          </p>
        </div>
        {FACTORS.map((k) => (
          <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 14px/1 var(--sans)' }}>
                <span style={{ width: 10, height: 4, borderRadius: 2, background: FACTOR_INFO[k].color }} />
                {FACTOR_INFO[k].label}
              </span>
              <span style={{ font: '700 14px/1 var(--mono)', color: 'var(--blue-hi)' }}>{Math.round((weights[k] / sw) * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={weights[k]}
              className={s.slider}
              onChange={(e) => onChange({ ...weights, [k]: Number(e.target.value) })}
              aria-valuetext={`${weights[k]} (${Math.round((weights[k] / sw) * 100)}% of the score)`}
            />
            <span style={{ font: '500 10px/1.3 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>{FACTOR_INFO[k].hint}</span>
          </label>
        ))}
        <div>
          <button type="button" className="btn btn-secondary" style={{ height: 40, padding: '0 16px', fontSize: 10 }} onClick={() => onChange(null)} disabled={FACTORS.every((k) => weights[k] === DEFAULT_WEIGHTS[k])}>
            Reset defaults
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 className="heading">Live ranking preview</h3>
          <span className="label" style={{ letterSpacing: '.12em' }}>
            vs default weights
          </span>
        </div>
        <div style={{ border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--charcoal)' }}>
          {top.map((m) => {
            const mv = m.defRank - m.rank;
            return (
              <div key={m.tag} className={s.previewRow}>
                <span style={{ font: '700 12px/1 var(--mono)', color: 'var(--text-3)' }}>{String(m.rank).padStart(2, '0')}</span>
                <span style={{ font: '600 14px/1.1 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                <span className={s.previewBar}>
                  <span style={{ display: 'block', height: '100%', width: `${m.score}%`, background: 'var(--blue)', boxShadow: '0 0 8px rgba(58,160,255,.7)', transition: 'width .4s' }} />
                </span>
                <span style={{ textAlign: 'right', font: '700 13px/1 var(--mono)' }}>{m.score}</span>
                <span style={{ textAlign: 'right', font: '600 11px/1 var(--mono)', color: mv > 0 ? 'var(--blue)' : mv < 0 ? 'var(--ember)' : 'var(--text-3)' }}>
                  {mv > 0 ? `▲ ${mv}` : mv < 0 ? `▼ ${-mv}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
