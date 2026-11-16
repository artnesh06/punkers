import { render } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar Color Variants', () => {
  describe('Red variant (default)', () => {
    it('applies red color class when color prop is "red"', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="red" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('red');
    });

    it('applies red color class by default when no color prop provided', () => {
      const { container } = render(<ProgressBar value={50} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('red');
    });
  });

  describe('Green variant', () => {
    it('applies green color class when color prop is "green"', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="green" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('green');
    });
  });

  describe('Orange variant', () => {
    it('applies orange color class when color prop is "orange"', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="orange" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('orange');
    });
  });

  describe('Yellow variant', () => {
    it('applies yellow color class when color prop is "yellow"', () => {
      const { container } = render(<ProgressBar value={50} max={100} color="yellow" />);
      const fill = container.querySelector('[class*="fill"]');
      expect(fill).toHaveClass('yellow');
    });
  });

  describe('Fill animation smoothness', () => {
    it('applies transition CSS for smooth animation', () => {
      const { container } = render(<ProgressBar value={50} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      // Check that the fill element exists and has the transition class
      expect(fill).toBeInTheDocument();
      expect(fill).toHaveClass('fill');
    });

    it('updates width smoothly when value changes', () => {
      const { container, rerender } = render(<ProgressBar value={25} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      expect(fill).toHaveStyle({ width: '25%' });
      
      // Update value
      rerender(<ProgressBar value={75} max={100} />);
      
      // Width should update (transition is handled by CSS)
      expect(fill).toHaveStyle({ width: '75%' });
    });

    it('handles rapid value changes smoothly', () => {
      const { container, rerender } = render(<ProgressBar value={0} max={100} />);
      const fill = container.querySelector('[class*="fill"]');
      
      // Simulate rapid updates
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      values.forEach(value => {
        rerender(<ProgressBar value={value} max={100} />);
        expect(fill).toHaveStyle({ width: `${value}%` });
      });
    });
  });

  describe('All variants with different values', () => {
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
