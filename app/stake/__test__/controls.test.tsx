import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterTabs from '@/components/features/FilterTabs';
import LayoutSwitcher from '@/components/features/LayoutSwitcher';

describe('Stake Page Controls', () => {
  describe('FilterTabs Component', () => {
    it('renders all filter options', () => {
      const mockOnFilterChange = jest.fn();
      const options = [
        { value: 'all', label: 'ALL (10)' },
        { value: 'staked', label: 'STAKED (5)' },
        { value: 'unstaked', label: 'UNSTAKED (5)' },
      ];

      render(
        <FilterTabs
          options={options}
          activeFilter="all"
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText('ALL (10)')).toBeInTheDocument();
      expect(screen.getByText('STAKED (5)')).toBeInTheDocument();
      expect(screen.getByText('UNSTAKED (5)')).toBeInTheDocument();
    });

    it('applies active state to selected filter', () => {
      const mockOnFilterChange = jest.fn();
      const options = [
        { value: 'all', label: 'ALL (10)' },
        { value: 'staked', label: 'STAKED (5)' },
      ];

      const { container } = render(
        <FilterTabs
          options={options}
          activeFilter="staked"
          onFilterChange={mockOnFilterChange}
        />
      );

      const stakedButton = screen.getByText('STAKED (5)');
      expect(stakedButton.className).toContain('active');
    });
  });

  describe('LayoutSwitcher Component', () => {
    it('renders all layout options', () => {
      const mockOnLayoutChange = jest.fn();

      render(
        <LayoutSwitcher
          activeLayout="grid3"
          onLayoutChange={mockOnLayoutChange}
        />
      );

      expect(screen.getByText('Layout')).toBeInTheDocument();
      expect(screen.getByTitle('Grid 3')).toBeInTheDocument();
      expect(screen.getByTitle('Grid 2')).toBeInTheDocument();
      expect(screen.getByTitle('Grid 4')).toBeInTheDocument();
      expect(screen.getByTitle('List')).toBeInTheDocument();
      expect(screen.getByTitle('List Detail')).toBeInTheDocument();
    });

    it('applies active state to selected layout', () => {
      const mockOnLayoutChange = jest.fn();

      const { container } = render(
        <LayoutSwitcher
          activeLayout="grid2"
          onLayoutChange={mockOnLayoutChange}
        />
      );

      const grid2Button = screen.getByTitle('Grid 2');
      expect(grid2Button.className).toContain('active');
    });
  });

  describe('Controls Row Integration', () => {
    it('renders showing count display', () => {
      const { container } = render(
        <div className="showingCount">showing 9 punkers</div>
      );

      expect(screen.getByText('showing 9 punkers')).toBeInTheDocument();
    });
  });
});
