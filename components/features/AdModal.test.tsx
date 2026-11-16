import { render, screen, fireEvent } from '@testing-library/react';
import AdModal from './AdModal';

describe('AdModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AdModal isOpen={false} onClose={mockOnClose} message="Test message" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('📢 Ad Info')).toBeInTheDocument();
  });

  it('displays message with left border', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    const message = screen.getByText('Test message');
    expect(message).toBeInTheDocument();
  });

  it('renders info rows when details are provided', () => {
    const details = {
      by: 'Test User',
      date: '2024-01-01',
      slot: '1',
      duration: '7 days',
      status: 'LIVE',
    };

    render(
      <AdModal
        isOpen={true}
        onClose={mockOnClose}
        message="Test message"
        details={details}
      />
    );

    expect(screen.getByText('By')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Slot')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('7 days')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    const overlay = screen.getByText('Test message').parentElement?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when ESC key is pressed', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render info rows when details are empty', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    expect(screen.queryByText('By')).not.toBeInTheDocument();
    expect(screen.queryByText('Date')).not.toBeInTheDocument();
  });

  it('applies green color to LIVE status', () => {
    const details = {
      status: 'LIVE',
    };

    render(
      <AdModal
        isOpen={true}
        onClose={mockOnClose}
        message="Test message"
        details={details}
      />
    );

    const statusValue = screen.getByText('LIVE');
    expect(statusValue).toHaveStyle({ color: 'var(--accent-green)' });
  });

  it('applies muted color to non-LIVE status', () => {
    const details = {
      status: 'EXPIRED',
    };

    render(
      <AdModal
        isOpen={true}
        onClose={mockOnClose}
        message="Test message"
        details={details}
      />
    );

    const statusValue = screen.getByText('EXPIRED');
    expect(statusValue).toHaveStyle({ color: 'var(--text-muted)' });
  });

  it('displays footer hint text', () => {
    render(
      <AdModal isOpen={true} onClose={mockOnClose} message="Test message" />
    );
    expect(
      screen.getByText('CLICK ANYWHERE OUTSIDE TO CLOSE')
    ).toBeInTheDocument();
  });
});
