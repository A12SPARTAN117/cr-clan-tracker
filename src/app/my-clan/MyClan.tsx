'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Portal } from '@/components/fx/Portal';
import { usePins } from '@/lib/pins';
import { TagSearch } from '@/components/TagSearch';

/** Opens the pinned clan's dashboard, or asks which clan to manage. */
export function MyClan() {
  const router = useRouter();
  const pins = usePins();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
      <TagSearch
        size="default"
        scope="clan"
        then="manage"
        defaultHint="Clan name or #tag. Press Pin on the dashboard and this page opens it straight away next time."
      />
    </div>
  );
}
