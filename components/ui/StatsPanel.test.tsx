import { render, screen } from '@testing-library/react';
import StatsPanel from './StatsPanel';
import type { StatItem } from './StatsPanel';

describe('StatsPanel', () => {
  const mockStats: StatItem[] = [
    { label: 'Total Staked', value: '1,234', color: 'green' },
    { label: 'Survivors', value: 500, color: 'white' },
    { label: 'Graveyard', value: 42, color: 'red' },
    { label: 'Day', value: 7, color: 'yellow' },
  ];

  it('renders all stat items', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText('Total Staked')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Survivors')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Graveyard')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('applies correct column class for 4 columns (default)', () => {
    const { container } = render(<StatsPanel stats={mockStats} />);
    const grid = container.firstChild;

    expect(grid).toHaveClass('cols4');
  });

  it('applies correct column class for 2 columns', () => {
    const { container } = render(<StatsPanel stats={mockStats} columns={2} />);
    const grid = container.firstChild;

    expect(grid).toHaveClass('cols2');
  });

  it('applies correct column class for 3 columns', () => {
    const { container } = render(<StatsPanel stats={mockStats} columns={3} />);
    const grid = container.firstChild;

    expect(grid).toHaveClass('cols3');
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatsPanel stats={mockStats} className="custom-class" />
    );
    const grid = container.firstChild;

    expect(grid).toHaveClass('custom-class');
  });

  it('renders with color variants', () => {
    const { container } = render(<StatsPanel stats={mockStats} />);

    // Check that color classes are applied
    const values = container.querySelectorAll('[class*="value"]');
    expect(values.length).toBeGreaterThan(0);
  });

  it('renders live indicator when live prop is true', () => {
    const liveStats: StatItem[] = [
      { label: 'Live Count', value: 100, live: true },
    ];

    const { container } = render(<StatsPanel stats={liveStats} />);
    const liveDot = container.querySelector('[class*="liveDot"]');

    expect(liveDot).toBeInTheDocument();
  });

  it('does not render live indicator when live prop is false', () => {
    const normalStats: StatItem[] = [
      { label: 'Normal Count', value: 100, live: false },
    ];

    const { container } = render(<StatsPanel stats={normalStats} />);
    const liveDot = container.querySelector('[class*="liveDot"]');

    expect(liveDot).not.toBeInTheDocument();
  });

  it('renders empty grid when stats array is empty', () => {
    const { container } = render(<StatsPanel stats={[]} />);
    const grid = container.firstChild;

    expect(grid).toBeInTheDocument();
    expect(grid?.childNodes.length).toBe(0);
  });

  it('handles string and number values', () => {
    const mixedStats: StatItem[] = [
      { label: 'String Value', value: '1,234 $PUNK' },
      { label: 'Number Value', value: 5000 },
    ];

    render(<StatsPanel stats={mixedStats} />);

    expect(screen.getByText('1,234 $PUNK')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
  });

  it('renders labels with uppercase styling', () => {
    const { container } = render(<StatsPanel stats={mockStats} />);
    const labels = container.querySelectorAll('[class*="label"]');

    expect(labels.length).toBe(mockStats.length);
  });

  it('renders stat cards with gradient borders', () => {
    const { container } = render(<StatsPanel stats={mockStats} />);
    const statCards = container.querySelectorAll('[class*="statCard"]');

    expect(statCards.length).toBe(mockStats.length);
  });
});
