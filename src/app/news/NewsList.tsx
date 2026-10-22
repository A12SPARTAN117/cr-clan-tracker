'use client';

import { HoverLink } from '@/components/ui/HoverLink';
import { useState } from 'react';
import type { NewsPost, NewsTag } from '@/content/news';
import { art } from '@/lib/art';
import { dstr } from '@/lib/format';
import { TAG_FG } from './tags';

export function NewsList({ posts }: { posts: NewsPost[] }) {
  const tags = [...new Set(posts.map((p) => p.tag))];
  const [f, setF] = useState<'all' | NewsTag>('all');
  const list = posts.filter((p) => f === 'all' || p.tag === f);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['all', ...tags] as const).map((t) => (
          <button key={t} type="button" className="chip" style={{ height: 30 }} aria-pressed={f === t} onClick={() => setF(t)}>
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))', gap: '28px 20px' }}>
        {list.map((p) => (
          <HoverLink key={p.slug} href={`/news/${p.slug}`} className="news-card" style={{ display: 'flex', flexDirection: 'column', gap: 14, color: 'var(--text-1)' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/10',
                borderRadius: 6,
                overflow: 'hidden',
                background: `var(--obsidian) ${art(p.scene)} center/cover`,
                filter: 'grayscale(1) brightness(.85)',
              }}
            >
              <span style={{ position: 'absolute', inset: 10, border: '1px solid rgba(var(--ink-rgb), .45)', borderRadius: 3 }} />
            </div>
            <span style={{ display: 'flex', gap: 12, font: '500 9px/1 var(--mono)', letterSpacing: '.14em' }}>
              <span style={{ color: TAG_FG[p.tag] }}>{p.tag}</span>
              <span style={{ color: 'var(--text-3)' }}>{dstr(new Date(p.date)).toUpperCase()}</span>
            </span>
            <span style={{ font: '600 21px/1.25 var(--sans)', textWrap: 'pretty' }}>{p.title}</span>
            <span style={{ font: '400 14px/1.5 var(--sans)', color: 'var(--text-2)', textWrap: 'pretty' }}>{p.summary}</span>
          </HoverLink>
        ))}
      </div>
    </div>
  );
}
