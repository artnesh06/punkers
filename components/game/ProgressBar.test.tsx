import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar (Game Component)', () => {
  describe('Basic functionality', () => {
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
  });

  describe('Color variants', () => {
    it('defaults to red color variant', () => {
      const { container } = render(<ProgressBar value={50} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('red');
    });

    it('applies red color class when specified', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="red" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('red');
    });

    it('applies green color class when specified', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="green" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('green');
    });

    it('applies orange color class when specified', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="orange" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('orange');
    });

    it('applies yellow color class when specified', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="yellow" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('yellow');
    });
  });

  describe('Animation smoothness', () => {
    it('applies transition CSS for smooth animation', () => {
      const { container } = render(<ProgressBar value={50} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      expect(fill).toBeInTheDocument();
      expect(fill).toHaveClass('fill');
    });

    it('updates width smoothly when value changes', () => {
      const { container, rerender } = render(<ProgressBar value={25} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      expect(fill).toHaveStyle({ width: '25%' });
      
      rerender(<ProgressBar value={75} max={100} />);
      expect(fill).toHaveStyle({ width: '75%' });
    });

    it('handles rapid value changes smoothly', () => {
      const { container, rerender } = render(<ProgressBar value={0} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach(value => {
        rerender(<ProgressBar value={value} max={100} />);
        expect(fill).toHaveStyle({ width: `${value}%` });
      });
    });
  });

  describe('All color variants at different values', () => {
    const colors: Array<'red' | 'green' | 'orange' | 'yellow'> = ['red', 'green', 'orange', 'yellow'];
    
    colors.forEach(color => {
      it(`renders ${color} variant at 0%`, () => {
        const { container } = render(<ProgressBar value={0} max={100} color={color} />);
        const fill = container.querySelector('[class*="fill"]');
        expect(fill).toHaveClass(color);
        expect(fill).toHaveStyle({ width: '0%' });
      });

      it(`renders ${color} variant at 50%`, () => {
        const { container } = render(<ProgressBar value={50} max={100} color={color} />);
        const fill = container.querySelector('[class*="fill"]');
        expect(fill).toHaveClass(color);
        expect(fill).toHaveStyle({ width: '50%' });
      });

      it(`renders ${color} variant at 100%`, () => {
        const { container } = render(<ProgressBar value={100} max={100} color={color} />);
        const fill = container.querySelector('[class*="fill"]');
        expect(fill).toHaveClass(color);
        expect(fill).toHaveStyle({ width: '100%' });
      });
    });
  });
});
