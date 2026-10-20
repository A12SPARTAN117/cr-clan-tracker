import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareRecap } from '@/components/ShareRecap';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob([PNG], { type: 'image/png' }))));
  URL.createObjectURL = vi.fn(() => 'blob:recap');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  vi.unstubAllGlobals();
  // Each test adds its own share support.
  delete (navigator as { share?: unknown }).share;
  delete (navigator as { canShare?: unknown }).canShare;
});

const open = async () => {
  render(<ShareRecap src="/player/ABC/recap" file="recap-ABC.png" title="Tester · season recap" />);
  await userEvent.click(screen.getByRole('button', { name: /share recap/i }));
  await screen.findByRole('img', { name: 'Tester · season recap' });
};

describe('ShareRecap', () => {
  it('draws the recap once and offers a download and the link on desktop', async () => {
    await open();
    expect(fetch).toHaveBeenCalledWith('/player/ABC/recap');
    expect(screen.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('download', 'recap-ABC.png');
    // No Web Share API: no Share button.
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();

    const write = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: write }, configurable: true });
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(write).toHaveBeenCalledWith('http://localhost:3000/player/ABC/recap');
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
  });

  it('shares the image itself on phones that can share files', async () => {
    const share = vi.fn(async () => {});
    Object.assign(navigator, { share, canShare: () => true });
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    const arg = (share.mock.calls[0] as unknown as [ShareData])[0];
    expect(arg.title).toBe('Tester · season recap');
    expect(arg.files?.[0]).toBeInstanceOf(File);
    expect(arg.files?.[0].name).toBe('recap-ABC.png');
  });

  it('shares the link where files cannot be shared, and stays quiet when the sheet is dismissed', async () => {
    const share = vi.fn(async () => {
      throw Object.assign(new Error('dismissed'), { name: 'AbortError' });
    });
    Object.assign(navigator, { share, canShare: () => false });
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(share).toHaveBeenCalledWith({ title: 'Tester · season recap', url: 'http://localhost:3000/player/ABC/recap' });
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('offers a retry when the image fails to draw', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 502 })));
    render(<ShareRecap src="/clan/XYZ/recap" file="recap-XYZ.png" title="Clan · clan recap" />);
    await userEvent.click(screen.getByRole('button', { name: /share recap/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled();
  });
});
