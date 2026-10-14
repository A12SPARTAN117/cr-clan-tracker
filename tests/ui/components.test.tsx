import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardTile } from '@/components/CardTile';
import { DeckBlock } from '@/components/DeckBlock';
import { ModeFilter } from '@/components/ModeFilter';
import { TagSearch } from '@/components/TagSearch';
import { FitValue, LeagueIcon, PolRating } from '@/components/ui/primitives';
import { toDeckCard } from '@/lib/decks';
import { cards, DECKS } from '../fixtures/battles';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: push, prefetch: () => {} }) }));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

beforeEach(() => push.mockReset());

describe('CardTile', () => {
  it('shows only the card art: no elixir badge, no frame', () => {
    const { container } = render(<CardTile slug="hog-rider" img="https://example.test/hog.png" />);
    const img = screen.getByRole('img', { name: 'Hog Rider' });
    expect(img).toHaveAttribute('src', 'https://example.test/hog.png');
    expect(container.querySelector('[aria-label$="elixir"]')).toBeNull();
    expect(container.textContent).not.toMatch(/\d/);
  });

  it('falls back to the next image when one fails', () => {
    render(<CardTile slug="hog-rider" img="https://example.test/missing.png" fallback="https://example.test/backup.png" />);
    const img = screen.getByRole('img', { name: 'Hog Rider' });
    fireEvent.error(img);
    expect(screen.getByRole('img', { name: 'Hog Rider' })).toHaveAttribute('src', 'https://example.test/backup.png');
  });

  it('shows a level strip when given a level', () => {
    render(<CardTile slug="knight" level={15} size="L" />);
    expect(screen.getByText('LV 15')).toBeInTheDocument();
  });
});

describe('DeckBlock', () => {
  const deck = cards(DECKS.hog).map(toDeckCard);

  it('renders the RoyaleAPI layout: chip, name, stats link, 8 cards and facts', () => {
    render(<DeckBlock name="Hog Rider · The Log" cards={deck} avgElixir={21 / 8} cycle={6} use={5.94} games={159} win={56.04} rank={1} href="/decks/abc" />);
    const block = screen.getByRole('article', { name: 'Hog Rider · The Log deck' });
    expect(within(block).getByText('5.9%')).toBeInTheDocument();
    expect(within(block).getByText('159')).toBeInTheDocument();
    expect(within(block).getByRole('link', { name: /Deck stats/ })).toHaveAttribute('href', '/decks/abc');
    expect(within(block).getAllByRole('img').filter((i) => i.tagName === 'IMG')).toHaveLength(8);
    expect(within(block).getByText('2.6')).toBeInTheDocument();
    expect(within(block).getByText('6')).toBeInTheDocument();
    expect(within(block).getByText('56.0%')).toBeInTheDocument();
  });

  it('omits what it does not know', () => {
    render(<DeckBlock name="Current" cards={deck} avgElixir={2.6} cycle={6} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Win/)).toBeNull();
  });
});

describe('ModeFilter', () => {
  const modes = [
    { key: 'pol', label: 'Ranked', kind: 'ranked' as const, count: 60 },
    { key: 'uc', label: 'Ultimate Champion', kind: 'uc' as const, count: 60 },
    { key: 'ladder', label: 'Ladder', kind: 'ladder' as const, count: 0 },
  ];

  it('marks the current mode and reports clicks', async () => {
    const onChange = vi.fn();
    render(<ModeFilter modes={modes} value="pol" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: /Ranked/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Ladder/ })).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(screen.getByRole('radio', { name: /Ultimate Champion/ }));
    expect(onChange).toHaveBeenCalledWith('uc');
  });

  it('uses the Ultimate Champion league art for its icon', () => {
    const { container } = render(<ModeFilter modes={modes} value="pol" onChange={() => {}} />);
    expect(container.querySelector('[data-mode="uc"] img')).toHaveAttribute('src', '/leagues/league10.png');
  });
});

describe('ratings and leagues', () => {
  it('puts the medal next to the rating', () => {
    render(<PolRating rating={2635} />);
    const el = screen.getByTitle(/Ultimate Champion medals/);
    expect(el).toHaveTextContent('2,635');
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('maps API leagues to league art', () => {
    render(<LeagueIcon league={7} />);
    expect(screen.getByRole('img', { name: 'Ultimate Champion' })).toHaveAttribute('src', '/leagues/league10.png');
  });
});

describe('FitValue', () => {
  it('shrinks long values instead of clipping them', () => {
    const { container: a } = render(<FitValue value="7" max={30} decode={false} />);
    const { container: b } = render(<FitValue value="1,234,567,890" max={30} decode={false} />);
    const fa = (a.querySelector('span') as HTMLElement).style.font;
    const fb = (b.querySelector('span') as HTMLElement).style.font;
    expect(fa).toContain('clamp(14px');
    expect(fb).toContain('clamp(14px');
    // The divisor (≈ characters × 0.62) grows with the length.
    const div = (f: string) => Number(/100cqi \/ ([\d.]+)/.exec(f)![1]);
    expect(div(fb)).toBeGreaterThan(div(fa));
    expect(b.querySelector('span')).toHaveStyle({ whiteSpace: 'nowrap' });
  });
});

describe('TagSearch', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          tagPlayer: null,
          tagClan: null,
          players: [{ tag: '2P2CRCL9G', name: 'rosa parks', clanName: 'NRT', trophies: 14000 }],
          clans: [{ tag: 'GPY82CR9', name: 'Rosa', badgeId: 16000015, members: 16, location: 'Mexico' }],
        }),
      ),
    );
  });

  it('opens a tag directly', async () => {
    render(<TagSearch size="default" />);
    await userEvent.type(screen.getByRole('combobox'), '#Q9YLY80P{Enter}');
    expect(push).toHaveBeenCalledWith('/t/Q9YLY80P');
  });

  it('sends names to the search page, keeping the scope', async () => {
    render(<TagSearch size="default" scope="clan" then="manage" />);
    await userEvent.type(screen.getByRole('combobox'), 'rosa{Enter}');
    expect(push).toHaveBeenCalledWith('/search?q=rosa&type=clan&then=manage');
  });

  it('player scope opens player tags as players', async () => {
    render(<TagSearch size="default" scope="player" />);
    await userEvent.type(screen.getByRole('combobox'), '#2P2CRCL9G{Enter}');
    expect(push).toHaveBeenCalledWith('/player/2P2CRCL9G');
  });

  it('flags impossible tag characters and does not navigate', async () => {
    render(<TagSearch size="default" />);
    await userEvent.type(screen.getByRole('combobox'), '#HELLO{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent(`"H" can't appear in a tag`);
    expect(push).not.toHaveBeenCalled();
  });

  it('suggests players and clans while typing and opens the chosen one', async () => {
    render(<TagSearch size="default" />);
    const box = screen.getByRole('combobox');
    await userEvent.type(box, 'rosa');
    const list = await screen.findByRole('listbox', {}, { timeout: 2000 });
    await waitFor(() => expect(within(list).getAllByRole('option').length).toBeGreaterThanOrEqual(2));
    expect(within(list).getByText('rosa parks')).toBeInTheDocument();
    expect(within(list).getByText('Rosa')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(push).toHaveBeenCalledWith('/player/2P2CRCL9G');
  });

  it('opens clan suggestions on their dashboard in manage mode', async () => {
    render(<TagSearch size="default" scope="clan" then="manage" />);
    await userEvent.type(screen.getByRole('combobox'), 'rosa');
    const list = await screen.findByRole('listbox', {}, { timeout: 2000 });
    await waitFor(() => expect(within(list).getByText('Rosa')).toBeInTheDocument());
    fireEvent.mouseDown(within(list).getByText('Rosa'));
    expect(push).toHaveBeenCalledWith('/clan/GPY82CR9/manage');
  });
});
