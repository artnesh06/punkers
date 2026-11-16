import { render, screen, fireEvent } from '@testing-library/react';
import NFTModal from './NFTModal';

describe('NFTModal', () => {
  const mockNFT = {
    tokenId: '1234',
    metadata: {
      name: 'Test Punker',
      image: '/test-image.png',
      attributes: [
        { trait_type: 'Background', value: 'Blue' },
        { trait_type: 'Hat', value: 'Cap' },
      ],
    },
    status: 'Alive',
    health: 85,
    rarity: 'Epic',
    points: 150,
    kills: 2,
    staked: true,
    earn: '10 $PUNK/day',
    tax: '6 $PUNK/day',
    net: '+4/day',
    stakedDay: 'Day 5',
    owner: '0x1234...5678',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NFTModal nft={mockNFT} isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Test Punker')).toBeInTheDocument();
    expect(screen.getByText('Epic')).toBeInTheDocument();
  });

  it('displays NFT image', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    const image = screen.getByAltText('Test Punker');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.png');
  });

  it('displays NFT stats', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('150')).toBeInTheDocument(); // points
    expect(screen.getByText('2')).toBeInTheDocument(); // kills
    expect(screen.getByText('YES')).toBeInTheDocument(); // staked
  });

  it('displays health bar with correct percentage', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays NFT attributes', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Hat')).toBeInTheDocument();
    expect(screen.getByText('Cap')).toBeInTheDocument();
  });

  it('displays status badge', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('● ALIVE')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays action buttons', () => {
    render(<NFTModal nft={mockNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('VIEW ON OPENSEA')).toBeInTheDocument();
    expect(screen.getByText('TRANSFER')).toBeInTheDocument();
  });

  it('handles NFT without metadata gracefully', () => {
    const nftWithoutMetadata = {
      tokenId: '5678',
      status: 'Alive',
      health: 100,
    };
    render(<NFTModal nft={nftWithoutMetadata} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Punker #5678')).toBeInTheDocument();
  });

  it('displays correct rarity color for legendary', () => {
    const legendaryNFT = { ...mockNFT, rarity: 'Legendary' };
    const { container } = render(
      <NFTModal nft={legendaryNFT} isOpen={true} onClose={mockOnClose} />
    );
    const rarityElement = screen.getByText('Legendary');
    expect(rarityElement).toHaveStyle({ color: '#ff4444' });
  });

  it('displays correct status for RIP NFTs', () => {
    const deadNFT = { ...mockNFT, status: 'RIP' };
    render(<NFTModal nft={deadNFT} isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('● RIP')).toBeInTheDocument();
  });
});
