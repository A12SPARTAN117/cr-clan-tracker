'use client';

import { useEffect } from 'react';
import { DonateCard } from '@/components/DonateCard';
import { LostScene } from '@/components/LostScene';

/** Any page that throws: the arena-down scene with Try again and the donate card. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // The digest matches the full error in the server logs (production hides the message).
    console.error(error.digest ? `Page error ${error.digest}` : error);
  }, [error]);

  return (
    <LostScene variant="crash" retry={retry}>
      <DonateCard />
    </LostScene>
  );
}
