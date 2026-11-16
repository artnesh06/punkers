import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Ticker from './Ticker';

// Mock fetch
global.fetch = jest.fn();

describe('Ticker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API not available'));
  });

  it('renders ticker with default ads', async () => {
    render(<Ticker />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/PUNKERS #069 just got STAKED/i).length).toBeGreaterThan(0);
    });
  });

  it('pauses animation on hover', async () => {
    render(<Ticker />);
    
    const banner = screen.getByRole('banner');
    
    // Hover over banner
    fireEvent.mouseEnter(banner);
    
    await waitFor(() => {
      const ticker = banner.querySelector('[role="marquee"]');
      expect(ticker).toHaveClass(/paused/);
    });
  });

  it('resumes animation on mouse leave when modal is closed', async () => {
    render(<Ticker />);
    
    const banner = screen.getByRole('banner');
    
    // Hover and then leave
    fireEvent.mouseEnter(banner);
    fireEvent.mouseLeave(banner);
    
    await waitFor(() => {
      const ticker = banner.querySelector('[role="marquee"]');
      expect(ticker).not.toHaveClass(/paused/);
    });
  });

  it('opens modal when ad item is clicked', async () => {
    render(<Ticker />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/PUNKERS #069 just got STAKED/i).length).toBeGreaterThan(0);
    });

    const adItem = screen.getAllByRole('button')[0];
    fireEvent.click(adItem);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('📢 Ad Info')).toBeInTheDocument();
    });
  });

  it('supports keyboard navigation for ad items', async () => {
    render(<Ticker />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/PUNKERS #069 just got STAKED/i).length).toBeGreaterThan(0);
    });

    const adItem = screen.getAllByRole('button')[0];
    
    // Press Enter key
    fireEvent.keyDown(adItem, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    render(<Ticker />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/PUNKERS #069 just got STAKED/i).length).toBeGreaterThan(0);
    });

    // Open modal
    const adItem = screen.getAllByRole('button')[0];
    fireEvent.click(adItem);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('loads ads from API when available', async () => {
    const mockAds = [
      {
        message: 'Test Ad 1',
        by: '0xTEST',
        date: '15 Mar 2026',
        slot: 'Slot #1',
        duration: '12 Hours',
        status: 'LIVE'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockAds })
    });

    render(<Ticker />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Test Ad 1/i).length).toBeGreaterThan(0);
    });
  });
});
