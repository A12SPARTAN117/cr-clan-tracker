import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LineChart } from '@/components/LineChart';

const day = (d: string) => Date.parse(`2026-10-${d}T00:00:00Z`);

describe('LineChart', () => {
  it('draws the goal line, breaks the series at gaps and projects from the last point', () => {
    const { container } = render(
      <LineChart
        label="Fame"
        target={3000}
        points={[
          { x: 'W1', v: 1000 },
          { x: 'W2', v: null },
          { x: 'W3', v: 1500 },
          { x: 'W4', v: 2000 },
        ]}
        projection={{ x: 'W6', v: 3000 }}
      />,
    );
    expect(screen.getByText('Goal 3,000')).toBeInTheDocument();
    const lines = container.querySelectorAll('polyline');
    // Projection, then two runs of the series either side of the gap.
    expect(lines).toHaveLength(3);
    // From the last real point (4th of 5, x = 75) to the projection at the right edge.
    expect(lines[0].getAttribute('points')!.split(' ').map((p) => Number(p.split(',')[0]))).toEqual([75, 100]);
    expect(lines[1].getAttribute('points')!.split(' ')).toHaveLength(1);
    expect(lines[2].getAttribute('points')!.split(' ')).toHaveLength(2);
    expect(screen.getByText('W1')).toBeInTheDocument();
    expect(screen.getByText('W6')).toBeInTheDocument();
  });

  it('places timed points by date and shows the nearest one on hover', () => {
    const { container } = render(
      <LineChart
        label="Trophies"
        points={[
          { x: '1 Oct', v: 10, t: day('01') },
          { x: '2 Oct', v: 20, t: day('02'), tip: 'note' },
          { x: '11 Oct', v: 30, t: day('11') },
        ]}
      />,
    );
    const xs = container.querySelector('polyline')!.getAttribute('points')!.split(' ').map((p) => Number(p.split(',')[0]));
    expect(xs).toEqual([0, 10, 100]);
    const plot = screen.getByRole('img', { name: 'Trophies' });
    plot.getBoundingClientRect = () => ({ left: 0, width: 200, top: 0, height: 100, right: 200, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerMove(plot, { clientX: 30 });
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
  });

  it('draws nothing without a value', () => {
    const { container } = render(<LineChart label="x" points={[{ x: 'a', v: null }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
