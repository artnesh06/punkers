import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Gallery from '../page';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Gallery Page - NFT Modal Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/nft/collection')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            nfts: [
              {
                tokenId: '1',
                metadata: {
                  name: 'Punker #1',
                  image: '/test-image-1.png',
                  attributes: [
                    { trait_type: 'Background', value: 'Blue' },
                  ],
                },
                status: 'Alive',
                health: 100,
                rarity: 'Common',
              },
              {
                tokenId: '2',
                metadata: {
                  name: 'Punker #2',
                  image: '/test-image-2.png',
                  attributes: [
                    { trait_type: 'Background', value: 'Red' },
                  ],
                },
                status: 'Alive',
                health: 85,
                rarity: 'Epic',
              },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('opens NFT modal when NFT card is clicked', async () => {
    render(<Gallery />);

    // Wait for NFTs to load
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    // Click on first NFT card
    const nftCard = screen.getByText('#1').closest('div');
    if (nftCard) {
      fireEvent.click(nftCard);
    }

    // Modal should open and display NFT details
    await waitFor(() => {
      expect(screen.getByText('Punker #1')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    render(<Gallery />);

    // Wait for NFTs to load
    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    // Click on first NFT card
    const nftCard = screen.getByText('#1').closest('div');
    if (nftCard) {
      fireEvent.click(nftCard);
    }

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Punker #1')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Punker #1')).not.toBeInTheDocument();
    });
  });

  it('displays correct NFT details in modal', async () => {
    render(<Gallery />);

    // Wait for NFTs to load
    await waitFor(() => {
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    // Click on second NFT card
    const nftCard = screen.getByText('#2').closest('div');
    if (nftCard) {
      fireEvent.click(nftCard);
    }

    // Verify modal displays correct details
    await waitFor(() => {
      expect(screen.getByText('Punker #2')).toBeInTheDocument();
      expect(screen.getByText('Epic')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Background')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
    });
  });
});
