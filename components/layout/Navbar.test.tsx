import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navbar from './Navbar';
import { useToast } from '@/lib/hooks/useToast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}));

jest.mock('@/lib/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('../wallet/WalletButton', () => {
  return function WalletButton() {
    return <div data-testid="wallet-button">Wallet Button</div>;
  };
});

jest.mock('../ui/ThemeToggle', () => ({
  ThemeToggle: function ThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  },
}));

describe('Navbar Component', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  describe('Task 5.1: Navbar structure and styling', () => {
    it('should render navbar with logo', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const logo = screen.getByText('PUNKERS');
      expect(logo).toBeInTheDocument();
      expect(logo.tagName).toBe('A');
      expect(logo).toHaveAttribute('href', '/');
    });

    it('should render all navigation links', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Rules')).toBeInTheDocument();
      expect(screen.getByText('Stake')).toBeInTheDocument();
      expect(screen.getByText('Survival')).toBeInTheDocument();
      expect(screen.getByText('Graveyard')).toBeInTheDocument();
      expect(screen.getByText('Treasury')).toBeInTheDocument();
    });

    it('should render wallet button and theme toggle', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      expect(screen.getByTestId('wallet-button')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Task 5.2: Navigation features', () => {
    it('should highlight active navigation link', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
      (usePathname as jest.Mock).mockReturnValue('/rules');
      
      render(<Navbar />);
      
      const rulesLink = screen.getByText('Rules');
      expect(rulesLink.closest('a')).toHaveClass('active');
    });

    it('should allow navigation to non-wallet-gated pages', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const rulesLink = screen.getByText('Rules');
      expect(rulesLink.tagName).toBe('A');
      expect(rulesLink).toHaveAttribute('href', '/rules');
    });
  });

  describe('Task 5.3: Wallet-gated navigation', () => {
    it('should show locked state for wallet-gated pages when wallet not connected', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      expect(galleryLink.tagName).toBe('BUTTON');
      expect(galleryLink).toHaveClass('locked');
    });

    it('should allow access to wallet-gated pages when wallet is connected', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      expect(galleryLink.tagName).toBe('A');
      expect(galleryLink).toHaveAttribute('href', '/gallery');
    });

    it('should show toast notification when clicking locked link', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      fireEvent.click(galleryLink);
      
      expect(mockShowToast).toHaveBeenCalledWith({
        message: 'Connect wallet to access Gallery',
        type: 'warning',
        duration: 3000,
      });
    });

    it('should not show toast when clicking unlocked link', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      fireEvent.click(galleryLink);
      
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for locked links', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      expect(galleryLink).toHaveAttribute('aria-label', 'Gallery - Wallet required');
    });

    it('should be keyboard accessible for locked links', () => {
      (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
      
      render(<Navbar />);
      
      const galleryLink = screen.getByText('Gallery');
      expect(galleryLink.tagName).toBe('BUTTON');
      expect(galleryLink).toHaveAttribute('type', 'button');
    });
  });
});
