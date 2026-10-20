import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/features';
import { SceneHeader } from '@/components/SceneHeader';
import { Reveal } from '@/components/fx/Reveal';
import { NEWS } from '@/content/news';
import { NewsList } from './NewsList';

export const metadata: Metadata = { title: 'News', description: 'Site updates and guides from CR Clan Tracker.' };

export default function NewsPage() {
  if (!FEATURES.news) notFound();
  const posts = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <SceneHeader scene="/scenes/scrolls.jpg" height="clamp(340px,42vh,460px)" fog={0.8} status={<span>Site updates · guides · balance notes</span>}>
        <Reveal as="h1" style={{ margin: 0, font: '800 clamp(46px,8vw,124px)/.86 var(--mono)', letterSpacing: '-.06em' }}>
          NEWS
        </Reveal>
      </SceneHeader>
      <main className="page" style={{ paddingTop: 28, gap: 24 }}>
        <NewsList posts={posts} />
      </main>
    </>
  );
}
