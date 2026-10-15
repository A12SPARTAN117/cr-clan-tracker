import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CardTile } from '@/components/CardTile';
import { Portal } from '@/components/fx/Portal';
import { Reveal } from '@/components/fx/Reveal';
import { DesignSystemDemos } from './demos';
import { HeatCell, LastSeen, LeagueIcon, RoleChip, ScoreGauge, StatTile } from '@/components/ui/primitives';
import { cardBySlug } from '@/lib/cards';

export const metadata: Metadata = { title: 'Design system' };

const SWATCHES = [
  ['void', '--void', 'Page, behind scenes'],
  ['charcoal', '--charcoal', 'Main surface'],
  ['obsidian', '--obsidian', 'Raised panels, rows'],
  ['slate', '--slate', 'Hover, inputs'],
  ['well', '--well', 'Recessed slots'],
  ['hairline', '--hair', 'Borders, dividers'],
  ['frame', '--frame', 'Inset white frames'],
  ['text-1', '--text-1', 'Primary text'],
  ['text-2', '--text-2', 'Secondary text'],
  ['text-3', '--text-3', 'Muted labels'],
  ['glow-blue', '--blue', 'Accent, links, focus, wins'],
  ['glow-blue-hi', '--blue-hi', 'Highlights, light tubes'],
  ['glow-blue-deep', '--blue-deep', 'Pressed, fills behind glow'],
  ['evolution', '--evo', 'Evo only'],
  ['hero / #1', '--gold', 'Hero, rank I'],
  ['ember', '--ember', 'Loss, inactive (small)'],
];

const knight = cardBySlug('knight');

export default function DesignSystemPage() {
  // Internal reference page: only in development.
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="page" style={{ maxWidth: 1280, gap: 72 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="live-dot" />
          CR Clan Tracker · Design system · V1
        </span>
        <Reveal as="h1" className="display-xl">
          OBSIDIAN
          <br />
          ARENA
        </Reveal>
        <p className="body" style={{ maxWidth: 620, fontSize: 18 }}>
          A monochrome world where light means data. Stone, marble, obsidian and glass in black, charcoal, grey and white. Blue
          light marks what is interactive, active or important. Real game art is the only full-colour element.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="label">01 · Colour tokens</span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
            gap: 1,
            background: 'var(--hair)',
            border: '1px solid var(--hair)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {SWATCHES.map(([name, v, use]) => (
            <div key={v} style={{ display: 'flex', flexDirection: 'column', background: 'var(--charcoal)' }}>
              <div style={{ height: 84, background: `var(${v})`, borderBottom: '1px solid var(--hair)' }} />
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ font: '600 13px/1.2 var(--sans)' }}>{name}</span>
                <span style={{ font: '500 10px/1.3 var(--mono)', color: 'var(--text-2)' }}>{v}</span>
                <span style={{ font: '500 9px/1.3 var(--mono)', letterSpacing: '.06em', color: 'var(--text-3)' }}>{use}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span className="label">02 · Components</span>
        <DesignSystemDemos />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 16 }}>
          <div className="panel ticks" style={{ overflow: 'visible' }}>
            <StatTile label="Stat tile · war participation" value="82" unit="%" delta="▲ 4 vs last week" tone="up" spark={[71, 74, 69, 78, 80, 76, 79, 82]} />
          </div>
          <div className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="label">Asset score gauge</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ScoreGauge score={24} size={40} />
              <ScoreGauge score={61} size={40} />
              <ScoreGauge score={92} size={40} />
              <ScoreGauge score={88} size={120} big />
            </div>
          </div>
          <div className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span className="label">War heatmap cells</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([0, 1, 2, 3, 4, 'pending', null] as const).map((v, i) => (
                <HeatCell key={i} value={v} height={30} />
              ))}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="label">Role chips · last seen · league</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <RoleChip role="leader" />
            <RoleChip role="coLeader" />
            <RoleChip role="elder" />
            <RoleChip role="member" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <LastSeen hours={3} />
            <LastSeen hours={50} />
            <LastSeen hours={220} />
            <LeagueIcon league={7} />
          </div>
        </div>

        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="label">Card tile · rarity materials · evo / hero / both / not owned</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '22px 18px', alignItems: 'flex-end' }}>
            <CardTile slug="archers" size="L" level={14} showLabel />
            <CardTile slug="battle-healer" size="L" level={14} showLabel />
            <CardTile slug="baby-dragon" size="L" level={14} showLabel />
            <CardTile slug="the-log" size="L" level={14} showLabel />
            <CardTile slug="boss-bandit" size="L" level={14} showLabel />
            <CardTile slug="bomber" evo size="L" level={14} showLabel />
            <CardTile slug="knight" evo hero split img={knight?.icons.evolution} img2={knight?.icons.hero} size="L" level={14} showLabel />
            <CardTile slug="rocket" owned={false} size="L" showLabel />
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--hair)' }}>
            <span className="label">Sizes</span>
            <CardTile slug="bomber" size="S" />
            <CardTile slug="bomber" size="M" level={14} />
            <CardTile slug="bomber" size="L" level={14} />
            <CardTile slug="bomber" size="XL" level={14} />
          </div>
        </div>

        <div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="label">States</span>
          <div className="data-since">Data since 02 Jun 2026 · History builds up from then.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="skeleton" style={{ height: 12, width: '60%' }} />
            <span className="skeleton" style={{ height: 12, width: '85%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Portal size={40} />
            <span className="label" style={{ color: 'var(--text-2)' }}>
              Portal loader · long loads
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, font: '500 11px/1 var(--mono)', letterSpacing: '.08em', color: 'var(--ember)' }}>
            <span style={{ width: 18, height: 18, border: '1px solid currentColor', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>
            PLAYER NOT FOUND · CHECK THE TAG
          </div>
        </div>
      </section>
    </main>
  );
}
