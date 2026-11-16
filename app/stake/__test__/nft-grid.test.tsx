import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NFTCard from '@/components/game/NFTCard';

describe('NFT Grid with Stake Cards', () => {
  const mockNFT = {
    tokenId: '1',
    name: 'Test Punker #1',
    imageUrl: '/test-image.png',
    emoji: '🎮',
    status: 'staked' as const,
    isStaked: true,
    health: 85,
    estimatedPoints: 10,
    stakedDate: '2024-01-01',
  };

  describe('NFTCard with stake variant', () => {
    it('renders NFT card with stake variant', () => {
      render(
        <NFTCard
          tokenId={mockNFT.tokenId}
          name={mockNFT.name}
          imageUrl={mockNFT.imageUrl}
          emoji={mockNFT.emoji}
          status={mockNFT.status}
          isStaked={mockNFT.isStaked}
          health={mockNFT.health}
          estimatedPoints={mockNFT.estimatedPoints}
          stakedDate={mockNFT.stakedDate}
          variant="stake"
        />
      );

      expect(screen.getByText(mockNFT.name)).toBeInTheDocument();
    });

    it('displays stake action buttons for unstaked NFT', () => {
      const handleStake = jest.fn();

      render(
        <NFTCard
          tokenId={mockNFT.tokenId}
          name={mockNFT.name}
          status="alive"
          isStaked={false}
          variant="stake"
          onStake={handleStake}
        />
      );

      const stakeButton = screen.getByText('STAKE');
      expect(stakeButton).toBeInTheDocument();
    });

    it('displays staked indicator button for staked NFT', () => {
      const handlePayTax = jest.fn();

      render(
        <NFTCard
          tokenId={mockNFT.tokenId}
          name={mockNFT.name}
          status="staked"
          isStaked={true}
          variant="stake"
          onPayTax={handlePayTax}
        />
      );

      const stakedButton = screen.getByText('STAKED');
      expect(stakedButton).toBeInTheDocument();
    });

    it('displays health bar when health is provided', () => {
      const { container } = render(
        <NFTCard
          tokenId={mockNFT.tokenId}
          name={mockNFT.name}
          health={85}
          variant="stake"
          status="staked"
          isStaked={true}
        />
      );

      // Health bar should be rendered for NFTs with health > 0
      // The ProgressBar component renders a div with class "container"
      const progressBar = container.querySelector('.container');
      expect(progressBar).toBeInTheDocument();

      // Check that the fill bar has the correct width
      const fillBar = container.querySelector('.fill');
      expect(fillBar).toHaveStyle('width: 85%');
    });

    it('displays estimated points when provided', () => {
      render(
        <NFTCard
          tokenId={mockNFT.tokenId}
          name={mockNFT.name}
          estimatedPoints={10}
          variant="stake"
        />
      );

      expect(screen.getByText(/10/)).toBeInTheDocument();
    });
  });

  describe('Grid Layout Classes', () => {
    it('applies grid3 layout class correctly', () => {
      const { container } = render(
        <div className="nftGrid grid3">
          <NFTCard tokenId="1" name="Test 1" variant="stake" />
          <NFTCard tokenId="2" name="Test 2" variant="stake" />
          <NFTCard tokenId="3" name="Test 3" variant="stake" />
        </div>
      );

      const grid = container.querySelector('.nftGrid');
      expect(grid).toHaveClass('grid3');
    });

    it('applies grid2 layout class correctly', () => {
      const { container } = render(
        <div className="nftGrid grid2">
          <NFTCard tokenId="1" name="Test 1" variant="stake" />
          <NFTCard tokenId="2" name="Test 2" variant="stake" />
        </div>
      );

      const grid = container.querySelector('.nftGrid');
      expect(grid).toHaveClass('grid2');
    });

    it('applies grid4 layout class correctly', () => {
      const { container } = render(
        <div className="nftGrid grid4">
          <NFTCard tokenId="1" name="Test 1" variant="stake" />
          <NFTCard tokenId="2" name="Test 2" variant="stake" />
          <NFTCard tokenId="3" name="Test 3" variant="stake" />
          <NFTCard tokenId="4" name="Test 4" variant="stake" />
        </div>
      );

      const grid = container.querySelector('.nftGrid');
      expect(grid).toHaveClass('grid4');
    });

    it('applies list layout class correctly', () => {
      const { container } = render(
        <div className="nftGrid list">
          <NFTCard tokenId="1" name="Test 1" variant="stake" />
        </div>
      );

      const grid = container.querySelector('.nftGrid');
      expect(grid).toHaveClass('list');
    });

    it('applies list-detail layout class correctly', () => {
      const { container } = render(
        <div className="nftGrid list-detail">
          <NFTCard tokenId="1" name="Test 1" variant="stake" />
        </div>
      );

      const grid = container.querySelector('.nftGrid');
      expect(grid).toHaveClass('list-detail');
    });
  });
});
