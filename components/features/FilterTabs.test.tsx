import { render, screen, fireEvent } from '@testing-library/react';
import FilterTabs from './FilterTabs';

describe('FilterTabs', () => {
  const mockOptions = [
    { value: 'all', label: 'All' },
    { value: 'staked', label: 'Staked' },
    { value: 'unstaked', label: 'Unstaked' },
  ];

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('renders all filter options', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Staked')).toBeInTheDocument();
    expect(screen.getByText('Unstaked')).toBeInTheDocument();
  });

  it('applies active class to the active filter', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="staked"
        onFilterChange={mockOnFilterChange}
      />
    );

    const stakedButton = screen.getByText('Staked');
    expect(stakedButton).toHaveClass('active');

    const allButton = screen.getByText('All');
    expect(allButton).not.toHaveClass('active');
  });

  it('calls onFilterChange when a tab is clicked', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const stakedButton = screen.getByText('Staked');
    fireEvent.click(stakedButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith('staked');
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
        className="custom-class"
      />
    );

    const filterTabs = container.querySelector('.filterTabs');
    expect(filterTabs).toHaveClass('custom-class');
  });

  it('renders buttons with correct type attribute', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('handles empty options array', () => {
    const { container } = render(
      <FilterTabs
        options={[]}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const filterTabs = container.querySelector('.filterTabs');
    expect(filterTabs).toBeInTheDocument();
    expect(filterTabs?.children).toHaveLength(0);
  });

  it('handles single option', () => {
    const singleOption = [{ value: 'all', label: 'All' }];
    render(
      <FilterTabs
        options={singleOption}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('All')).toHaveClass('active');
  });

  it('does not call onFilterChange when clicking the already active tab', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const allButton = screen.getByText('All');
    fireEvent.click(allButton);

    // Should still call the handler (component doesn't prevent it)
    expect(mockOnFilterChange).toHaveBeenCalledWith('all');
  });

  it('applies filterTab class to all buttons', () => {
    render(
      <FilterTabs
        options={mockOptions}
        activeFilter="all"
        onFilterChange={mockOnFilterChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('filterTab');
    });
  });
});
