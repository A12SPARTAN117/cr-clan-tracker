'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Portal } from '@/components/fx/Portal';
import { usePins } from '@/lib/pins';
import { checkTag } from '@/lib/tags';

/** Opens the pinned clan's dashboard, or asks which clan to manage. */
export function MyClan() {
  const router = useRouter();
  const pins = usePins();
  const [q, setQ] = useState('');
  const c = checkTag(q);

  useEffect(() => {
    if (pins.clan) router.replace(`/clan/${pins.clan}/manage`);
  }, [pins.clan, router]);

  if (pins.clan)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Portal size={40} />
        <span className="label" style={{ color: 'var(--text-2)' }}>
          Opening #{pins.clan}…
        </span>
      </div>
    );

  const go = () => {
    if (c.kind === 'valid') router.push(`/clan/${c.tag}/manage`);
    else if (q.trim().length > 2) router.push(`/clans?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <label className="field" style={{ height: 56, padding: '0 8px 0 10px', borderColor: c.kind === 'invalid' ? 'rgba(255,84,100,.6)' : undefined }}>
        <span
          aria-hidden
          style={{ width: 34, height: 34, borderRadius: 4, background: 'var(--slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 15px/1 var(--mono)', color: 'var(--blue-hi)' }}
        >
          #
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          placeholder="Clan tag or name"
          aria-label="Clan tag or name"
          autoComplete="off"
          style={{ font: '700 16px/1 var(--mono)', letterSpacing: '.1em', textTransform: 'uppercase' }}
        />
        <button type="button" className="btn btn-primary" style={{ height: 40, padding: '0 16px' }} onClick={go}>
          {c.kind === 'valid' ? 'Open ↵' : 'Search'}
        </button>
      </label>
      <span style={{ font: '500 10px/1.6 var(--mono)', letterSpacing: '.1em', color: c.kind === 'invalid' ? 'var(--ember)' : 'var(--text-3)' }}>
        {c.kind === 'invalid'
          ? `"${c.bad}" can't appear in a tag. Tags only use 0 2 8 9 P Y L Q G R J C U V.`
          : 'Find the clan tag in-game under the clan name. Press Pin on the dashboard and this page opens it straight away.'}
      </span>
    </div>
  );
}
