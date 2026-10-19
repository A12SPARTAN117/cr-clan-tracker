import type { CSSProperties, ReactNode } from 'react';
import { art } from '@/lib/art';
import { EmberField } from './fx/EmberField';
import { Fog } from './fx/Fog';
import s from './SceneHeader.module.css';

/**
 * Inner-page header band. Layer stack: void → scene still → fog → character → extra
 * (e.g. rune) → scrim → inset frame → copy.
 */
export function SceneHeader({
  scene,
  height = 'clamp(380px, 50vh, 540px)',
  status,
  character,
  extra,
  fog = 1.1,
  sceneFilter,
  scenePosition,
  children,
  style,
}: {
  scene: string;
  height?: string;
  status?: ReactNode;
  character?: string | null;
  extra?: ReactNode;
  fog?: number;
  /** Override the default greyscale treatment, e.g. for art that is already black and white. */
  sceneFilter?: string;
  scenePosition?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className={s.scene} style={{ minHeight: height, ...style }}>
      <div
        className={s.still}
        data-art={sceneFilter ? 'colour' : ''}
        style={{ backgroundImage: art(scene), filter: sceneFilter, backgroundPosition: scenePosition }}
      />
      <Fog density={fog} />
      <EmberField />
      {character && <div className={s.char} style={{ backgroundImage: `url(${character})` }} aria-hidden />}
      {extra}
      <div className={s.scrim} />
      <div className={s.frame} />
      <div className={s.inner}>
        <div className={s.status}>{status}</div>
        <div>{children}</div>
      </div>
    </section>
  );
}
