import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar value={50} max={100} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<ProgressBar value={25} max={100} label="Health" />);
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('renders with current/max format when current prop is provided', () => {
    render(<ProgressBar value={0} max={100} current={75} />);
    expect(screen.getByText('75 / 100')).toBeInTheDocument();
  });

  it('applies correct color variant class', () => {
    const { container } = render(<ProgressBar value={50} max={100} color="green" />);
    const fill = container.querySelector('[class*="fill"]');
    expect(fill).toHaveClass('green');
  });

  it('calculates percentage correctly', () => {
    const { container } = render(<ProgressBar value={33} max={100} />);
    const fill = container.querySelector('[class*="fill"]');
    expect(fill).toHaveStyle({ width: '33%' });
  });

  it('caps percentage at 100%', () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    const fill = container.querySelector('[class*="fill"]');
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('handles zero max value', () => {
    const { container } = render(<ProgressBar value={50} max={0} />);
    const fill = container.querySelector('[class*="fill"]');
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('hides percentage text when showPercentage is false', () => {
    render(<ProgressBar value={50} max={100} showPercentage={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('defaults to red color variant', () => {
    const { container } = render(<ProgressBar value={50} max={100} />);
    const fill = container.querySelector('[class*="fill"]');
    expect(fill).toHaveClass('red');
  });
});
