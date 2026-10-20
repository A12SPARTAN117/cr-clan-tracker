'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import s from './ShareRecap.module.css';

type State = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ready'; file: File; url: string } | { kind: 'error' };

/**
 * "Share recap": draws the recap PNG once when opened, then offers the phone share sheet (with
 * the image itself where the browser can share files), a download, and the image's link.
 */
export function ShareRecap({ src, file, title, style }: { src: string; file: string; title: string; style?: React.CSSProperties }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [note, setNote] = useState('');
  const [canShare, setCanShare] = useState<'files' | 'link' | null>(null);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const r = await fetch(src);
      if (!r.ok) throw new Error(String(r.status));
      const f = new File([await r.blob()], file, { type: 'image/png' });
      setState({ kind: 'ready', file: f, url: URL.createObjectURL(f) });
      setCanShare(navigator.canShare?.({ files: [f] }) ? 'files' : typeof navigator.share === 'function' ? 'link' : null);
    } catch {
      setState({ kind: 'error' });
    }
  }, [src, file]);

  // The object URL lives as long as the drawn image.
  useEffect(() => () => void (state.kind === 'ready' && URL.revokeObjectURL(state.url)), [state]);

  const open = () => {
    setNote('');
    const d = dialog.current;
    if (d && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }
    if (state.kind === 'idle' || state.kind === 'error') void load();
  };
  const close = () => {
    const d = dialog.current;
    if (typeof d?.close === 'function') d.close();
    else d?.removeAttribute('open');
  };
  const link = () => new URL(src, window.location.href).href;

  const share = async () => {
    if (state.kind !== 'ready') return;
    try {
      if (canShare === 'files') await navigator.share({ files: [state.file], title });
      else await navigator.share({ title, url: link() });
    } catch (e) {
      // Closing the share sheet is not an error.
      if ((e as Error)?.name !== 'AbortError') setNote('Sharing failed. Download it instead');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setNote('Link copied');
    } catch {
      setNote(link());
    }
  };

  return (
    <>
      <button type="button" className="btn btn-scene" style={style} onClick={open} aria-haspopup="dialog">
        Share recap ↗
      </button>
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-labelledby="recap-title"
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className={s.body}>
          <div className={s.head}>
            <h2 id="recap-title" className={s.title}>
              {title}
            </h2>
            <button type="button" className={s.close} onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
          <div className={s.preview} aria-busy={state.kind === 'loading'}>
            {state.kind === 'ready' ? (
              // eslint-disable-next-line @next/next/no-img-element -- a generated blob, not static art
              <img src={state.url} alt={title} width={1080} height={1350} />
            ) : state.kind === 'error' ? (
              <div className={s.msg}>
                <span>The recap couldn&apos;t be drawn right now.</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
                  Try again
                </button>
              </div>
            ) : (
              <div className={`${s.msg} skeleton`}>Drawing recap…</div>
            )}
          </div>
          <div className={s.actions}>
            {canShare && (
              <button type="button" className="btn btn-primary" disabled={state.kind !== 'ready'} onClick={() => void share()}>
                Share
              </button>
            )}
            {state.kind === 'ready' ? (
              <a className="btn btn-secondary" href={state.url} download={file}>
                Download PNG
              </a>
            ) : (
              <button type="button" className="btn btn-secondary" disabled>
                Download PNG
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
              Copy link
            </button>
          </div>
          <p className={s.note} role="status">
            {note}
          </p>
        </div>
      </dialog>
    </>
  );
}
