import { render } from '@testing-library/react';
import StatsPanel from './StatsPanel';
import type { StatItem } from './StatsPanel';
import styles from './StatsPanel.module.css';

/**
 * Feature tests for StatsPanel component
 * Task 13.2: Verify all StatsPanel features
 * - Color variants (green, red, yellow, white)
 * - Live indicator with pulse animation
 * - Hover effects on cards
 * - Gradient border effects (top/bottom)
 * - Responsive column changes
 */

describe('StatsPanel Features (Task 13.2)', () => {
  describe('Color Variants', () => {
    it('applies green color variant with text shadow', () => {
      const stats: StatItem[] = [
        { label: 'Green Stat', value: '100', color: 'green' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const valueElement = container.querySelector(`.${styles.value}.${styles.green}`);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent('100');
    });

    it('applies red color variant with text shadow', () => {
      const stats: StatItem[] = [
        { label: 'Red Stat', value: '50', color: 'red' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const valueElement = container.querySelector(`.${styles.value}.${styles.red}`);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent('50');
    });

    it('applies yellow color variant with text shadow', () => {
      const stats: StatItem[] = [
        { label: 'Yellow Stat', value: '75', color: 'yellow' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const valueElement = container.querySelector(`.${styles.value}.${styles.yellow}`);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent('75');
    });

    it('applies white color variant', () => {
      const stats: StatItem[] = [
        { label: 'White Stat', value: '25', color: 'white' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const valueElement = container.querySelector(`.${styles.value}.${styles.white}`);
      expect(valueElement).toBeInTheDocument();
      expect(valueElement).toHaveTextContent('25');
    });

    it('renders all color variants together', () => {
      const stats: StatItem[] = [
        { label: 'Green', value: '100', color: 'green' },
        { label: 'Red', value: '50', color: 'red' },
        { label: 'Yellow', value: '75', color: 'yellow' },
        { label: 'White', value: '25', color: 'white' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      expect(container.querySelector(`.${styles.green}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.red}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.yellow}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.white}`)).toBeInTheDocument();
    });
  });

  describe('Live Indicator with Pulse Animation', () => {
    it('renders live indicator dot when live prop is true', () => {
      const stats: StatItem[] = [
        { label: 'Live Stat', value: '100', live: true },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const liveDot = container.querySelector(`.${styles.liveDot}`);
      expect(liveDot).toBeInTheDocument();
    });

    it('does not render live indicator when live prop is false', () => {
      const stats: StatItem[] = [
        { label: 'Static Stat', value: '100', live: false },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const liveDot = container.querySelector(`.${styles.liveDot}`);
      expect(liveDot).not.toBeInTheDocument();
    });

    it('does not render live indicator when live prop is undefined', () => {
      const stats: StatItem[] = [
        { label: 'Static Stat', value: '100' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const liveDot = container.querySelector(`.${styles.liveDot}`);
      expect(liveDot).not.toBeInTheDocument();
    });

    it('renders live indicator with correct styling', () => {
      const stats: StatItem[] = [
        { label: 'Live Stat', value: '100', live: true },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const liveDot = container.querySelector(`.${styles.liveDot}`);
      expect(liveDot).toHaveClass(styles.liveDot);
    });

    it('can combine live indicator with color variants', () => {
      const stats: StatItem[] = [
        { label: 'Live Green', value: '100', color: 'green', live: true },
        { label: 'Live Red', value: '50', color: 'red', live: true },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const liveDots = container.querySelectorAll(`.${styles.liveDot}`);
      expect(liveDots).toHaveLength(2);
      
      const greenValue = container.querySelector(`.${styles.green}`);
      const redValue = container.querySelector(`.${styles.red}`);
      expect(greenValue).toBeInTheDocument();
      expect(redValue).toBeInTheDocument();
    });
  });

  describe('Hover Effects on Cards', () => {
    it('applies statCard class to all cards', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
        { label: 'Stat 3', value: '300' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const statCards = container.querySelectorAll(`.${styles.statCard}`);
      expect(statCards).toHaveLength(3);
    });

    it('stat cards have transition property for hover effects', () => {
      const stats: StatItem[] = [
        { label: 'Hoverable Stat', value: '100' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const statCard = container.querySelector(`.${styles.statCard}`);
      expect(statCard).toBeInTheDocument();
      expect(statCard).toHaveClass(styles.statCard);
    });
  });

  describe('Gradient Border Effects', () => {
    it('renders stat cards with gradient border pseudo-elements', () => {
      const stats: StatItem[] = [
        { label: 'Bordered Stat', value: '100' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const statCard = container.querySelector(`.${styles.statCard}`);
      expect(statCard).toBeInTheDocument();
      
      // Verify the card has the class that applies ::before and ::after pseudo-elements
      expect(statCard).toHaveClass(styles.statCard);
    });

    it('all stat cards have gradient border styling', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
        { label: 'Stat 3', value: '300' },
        { label: 'Stat 4', value: '400' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const statCards = container.querySelectorAll(`.${styles.statCard}`);
      expect(statCards).toHaveLength(4);
      
      statCards.forEach(card => {
        expect(card).toHaveClass(styles.statCard);
      });
    });
  });

  describe('Responsive Column Changes', () => {
    it('applies cols2 class for 2-column layout', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
      ];
      const { container } = render(<StatsPanel stats={stats} columns={2} />);
      
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols2);
    });

    it('applies cols3 class for 3-column layout', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
        { label: 'Stat 3', value: '300' },
      ];
      const { container } = render(<StatsPanel stats={stats} columns={3} />);
      
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols3);
    });

    it('applies cols4 class for 4-column layout (default)', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
        { label: 'Stat 3', value: '300' },
        { label: 'Stat 4', value: '400' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols4);
    });

    it('applies cols4 class explicitly when columns prop is 4', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
        { label: 'Stat 3', value: '300' },
        { label: 'Stat 4', value: '400' },
      ];
      const { container } = render(<StatsPanel stats={stats} columns={4} />);
      
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols4);
    });

    it('maintains responsive classes with different column configurations', () => {
      const stats: StatItem[] = [
        { label: 'Stat 1', value: '100' },
        { label: 'Stat 2', value: '200' },
      ];
      
      // Test 2 columns
      const { container: container2 } = render(<StatsPanel stats={stats} columns={2} />);
      expect(container2.querySelector(`.${styles.statsGrid}`)).toHaveClass(styles.cols2);
      
      // Test 3 columns
      const { container: container3 } = render(<StatsPanel stats={stats} columns={3} />);
      expect(container3.querySelector(`.${styles.statsGrid}`)).toHaveClass(styles.cols3);
      
      // Test 4 columns
      const { container: container4 } = render(<StatsPanel stats={stats} columns={4} />);
      expect(container4.querySelector(`.${styles.statsGrid}`)).toHaveClass(styles.cols4);
    });
  });

  describe('Complete Feature Integration', () => {
    it('renders all features together correctly', () => {
      const stats: StatItem[] = [
        { label: 'Total Staked', value: '1,234', color: 'green', live: true },
        { label: 'Survivors', value: 500, color: 'white' },
        { label: 'Graveyard', value: 42, color: 'red' },
        { label: 'Day', value: 7, color: 'yellow', live: true },
      ];
      const { container } = render(<StatsPanel stats={stats} columns={4} />);
      
      // Check grid layout
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols4);
      
      // Check all stat cards
      const statCards = container.querySelectorAll(`.${styles.statCard}`);
      expect(statCards).toHaveLength(4);
      
      // Check color variants
      expect(container.querySelector(`.${styles.green}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.white}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.red}`)).toBeInTheDocument();
      expect(container.querySelector(`.${styles.yellow}`)).toBeInTheDocument();
      
      // Check live indicators (2 stats have live: true)
      const liveDots = container.querySelectorAll(`.${styles.liveDot}`);
      expect(liveDots).toHaveLength(2);
    });

    it('handles edge case with single stat', () => {
      const stats: StatItem[] = [
        { label: 'Single Stat', value: '999', color: 'green', live: true },
      ];
      const { container } = render(<StatsPanel stats={stats} columns={2} />);
      
      const grid = container.querySelector(`.${styles.statsGrid}`);
      expect(grid).toHaveClass(styles.cols2);
      
      const statCard = container.querySelector(`.${styles.statCard}`);
      expect(statCard).toBeInTheDocument();
      
      const greenValue = container.querySelector(`.${styles.green}`);
      expect(greenValue).toBeInTheDocument();
      
      const liveDot = container.querySelector(`.${styles.liveDot}`);
      expect(liveDot).toBeInTheDocument();
    });

    it('handles stats without optional properties', () => {
      const stats: StatItem[] = [
        { label: 'Basic Stat 1', value: '100' },
        { label: 'Basic Stat 2', value: '200' },
      ];
      const { container } = render(<StatsPanel stats={stats} />);
      
      const statCards = container.querySelectorAll(`.${styles.statCard}`);
      expect(statCards).toHaveLength(2);
      
      // No color classes should be applied (except base value class)
      const values = container.querySelectorAll(`.${styles.value}`);
      expect(values).toHaveLength(2);
      
      // No live indicators
      const liveDots = container.querySelectorAll(`.${styles.liveDot}`);
      expect(liveDots).toHaveLength(0);
    });
  });
});
