import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardTile } from '@/components/CardTile';
import { NEWS, newsBySlug } from '@/content/news';
import { cardBySlug } from '@/lib/cards';
import { dstr } from '@/lib/format';
import { TAG_FG } from '../tags';

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: PageProps<'/news/[slug]'>): Promise<Metadata> {
  const n = newsBySlug((await params).slug);
  return n ? { title: n.title, description: n.summary } : { title: 'News' };
}

const KIND = {
  buff: { fg: 'var(--blue)', arrow: '▲', label: 'BUFF' },
  nerf: { fg: 'var(--ember)', arrow: '▼', label: 'NERF' },
  rework: { fg: 'var(--text-2)', arrow: '◆', label: 'REWORK' },
};

export default async function NewsArticle({ params }: PageProps<'/news/[slug]'>) {
  const n = newsBySlug((await params).slug);
  if (!n) notFound();
  const words = n.body.join(' ').split(/\s+/).length;
  return (
    <article style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(18px,4vw,24px) 80px', display: 'flex', flexDirection: 'column', gap: 26, animation: 'oaFade .35s' }}>
      <Link href="/news" className="link-mono" style={{ alignSelf: 'flex-start' }}>
        ← All news
      </Link>
      <span style={{ display: 'flex', gap: 12, font: '500 10px/1 var(--mono)', letterSpacing: '.14em' }}>
        <span style={{ color: TAG_FG[n.tag] }}>{n.tag}</span>
        <span style={{ color: 'var(--text-3)' }}>
          {dstr(new Date(n.date)).toUpperCase()} · {Math.max(1, Math.round(words / 220))} MIN READ
        </span>
      </span>
      <h1 style={{ margin: 0, font: '800 clamp(34px,5vw,60px)/.98 var(--mono)', letterSpacing: '-.045em', textWrap: 'balance' }}>{n.title}</h1>
      <p style={{ margin: 0, font: '400 20px/1.5 var(--sans)', color: 'var(--text-2)', textWrap: 'pretty' }}>{n.summary}</p>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 6, overflow: 'hidden', background: `var(--obsidian) url(${n.scene}) center/cover`, filter: 'grayscale(1)' }}>
        <span style={{ position: 'absolute', inset: 12, border: '1px solid rgba(255,255,255,.45)', borderRadius: 3 }} />
      </div>
      {n.changes && (
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--hair)' }}>
          {n.changes.map((c) => {
            const info = cardBySlug(c.card);
            const k = KIND[c.kind];
            return (
              <div key={c.card + c.text} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 18, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--hair)' }}>
                <CardTile slug={c.card} rarity={info?.rarity} size="S" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: '600 17px/1.2 var(--sans)' }}>{info?.name ?? c.card}</span>
                  <span style={{ font: '400 15px/1.5 var(--sans)', color: 'var(--text-2)' }}>{c.text}</span>
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 28,
                    padding: '0 10px',
                    border: `1px solid ${k.fg}`,
                    borderRadius: 4,
                    font: '700 10px/1 var(--mono)',
                    letterSpacing: '.12em',
                    color: k.fg,
                  }}
                >
                  {k.arrow} {k.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {n.body.map((b, i) => (
        <p key={i} style={{ margin: 0, font: '400 18px/1.7 var(--sans)', textWrap: 'pretty' }}>
          {b}
        </p>
      ))}
      <span style={{ paddingTop: 20, borderTop: '1px solid var(--hair)', font: '500 10px/1.6 var(--mono)', letterSpacing: '.1em', color: 'var(--text-3)' }}>SOURCE · CR CLAN TRACKER</span>
    </article>
  );
}
