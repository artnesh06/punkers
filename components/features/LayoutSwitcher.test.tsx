import { render, screen, fireEvent } from '@testing-library/react';
import LayoutSwitcher, { type LayoutOption } from './LayoutSwitcher';

describe('LayoutSwitcher', () => {
  const mockOnLayoutChange = jest.fn();

  beforeEach(() => {
    mockOnLayoutChange.mockClear();
  });

  it('renders all layout buttons', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByTitle('Grid 3')).toBeInTheDocument();
    expect(screen.getByTitle('Grid 2')).toBeInTheDocument();
    expect(screen.getByTitle('Grid 4')).toBeInTheDocument();
    expect(screen.getByTitle('List')).toBeInTheDocument();
    expect(screen.getByTitle('List Detail')).toBeInTheDocument();
  });

  it('renders layout label', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByText('Layout')).toBeInTheDocument();
  });

  it('applies active class to the active layout button', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const grid3Button = screen.getByTitle('Grid 3');
    expect(grid3Button).toHaveClass('active');
  });

  it('does not apply active class to inactive buttons', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const grid2Button = screen.getByTitle('Grid 2');
    const listButton = screen.getByTitle('List');

    expect(grid2Button).not.toHaveClass('active');
    expect(listButton).not.toHaveClass('active');
  });

  it('calls onLayoutChange when a button is clicked', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const grid2Button = screen.getByTitle('Grid 2');
    fireEvent.click(grid2Button);

    expect(mockOnLayoutChange).toHaveBeenCalledWith('grid2');
    expect(mockOnLayoutChange).toHaveBeenCalledTimes(1);
  });

  it('calls onLayoutChange with correct layout value for each button', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const layouts: Array<{ title: string; value: LayoutOption }> = [
      { title: 'Grid 3', value: 'grid3' },
      { title: 'Grid 2', value: 'grid2' },
      { title: 'Grid 4', value: 'grid4' },
      { title: 'List', value: 'list' },
      { title: 'List Detail', value: 'list-detail' },
    ];

    layouts.forEach(({ title, value }) => {
      mockOnLayoutChange.mockClear();
      const button = screen.getByTitle(title);
      fireEvent.click(button);
      expect(mockOnLayoutChange).toHaveBeenCalledWith(value);
    });
  });

  it('renders SVG icons in all buttons', () => {
    const { container } = render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
        className="custom-class"
      />
    );

    const layoutBar = container.firstChild;
    expect(layoutBar).toHaveClass('custom-class');
  });

  it('has correct button type attribute', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('has aria-label for accessibility', () => {
    render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByLabelText('Grid 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Grid 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Grid 4')).toBeInTheDocument();
    expect(screen.getByLabelText('List')).toBeInTheDocument();
    expect(screen.getByLabelText('List Detail')).toBeInTheDocument();
  });

  it('updates active state when activeLayout prop changes', () => {
    const { rerender } = render(
      <LayoutSwitcher
        activeLayout="grid3"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByTitle('Grid 3')).toHaveClass('active');
    expect(screen.getByTitle('List')).not.toHaveClass('active');

    rerender(
      <LayoutSwitcher
        activeLayout="list"
        onLayoutChange={mockOnLayoutChange}
      />
    );

    expect(screen.getByTitle('Grid 3')).not.toHaveClass('active');
    expect(screen.getByTitle('List')).toHaveClass('active');
  });
});
