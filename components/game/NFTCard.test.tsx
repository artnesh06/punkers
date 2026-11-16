import { render, screen } from '@testing-library/react';
import NFTCard from './NFTCard';

describe('NFTCard', () => {
  describe('Gallery Variant', () => {
    it('renders gallery card with emoji', () => {
      render(
        <NFTCard
          tokenId="1"
          emoji="😼"
          variant="gallery"
          label="PUNKER #1"
        />
      );
      
      expect(screen.getByText('😼')).toBeInTheDocument();
      expect(screen.getByText('PUNKER #1')).toBeInTheDocument();
    });

    it('applies hover effects on gallery card', () => {
      const { container } = render(
        <NFTCard
          tokenId="1"
          emoji="😼"
          variant="gallery"
        />
      );
      
      const card = container.querySelector('.nftCard');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Stake Variant', () => {
    it('renders stake card with all info', () => {
      render(
        <NFTCard
          tokenId="70"
          name="Ink Cat Biz (ICB) #70"
          emoji="😼"
          variant="stake"
          status="staked"
          estimatedPoints={10}
          health={75}
        />
      );
      
      expect(screen.getByText('Ink Cat Biz (ICB) #70')).toBeInTheDocument();
      expect(screen.getByText(/Est\. Points\/Day:/)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('renders audited status badge', () => {
      render(
        <NFTCard
          tokenId="86"
          name="Ink Cat Biz (ICB) #86"
          emoji="😼"
          variant="stake"
          status="audited"
          estimatedPoints={10}
        />
      );
      
      expect(screen.getByText('🔍 AUDITED')).toBeInTheDocument();
    });

    it('renders RIP status for dead NFT', () => {
      render(
        <NFTCard
          tokenId="70"
          name="Ink Cat Biz (ICB) #70"
          emoji="💀"
          variant="stake"
          status="rip"
          isDead={true}
        />
      );
      
      expect(screen.getByText('🪦 RIP')).toBeInTheDocument();
      expect(screen.getByText('Execution on Day 42')).toBeInTheDocument();
    });

    it('renders stake button for unstaked NFT', () => {
      const onStake = jest.fn();
      render(
        <NFTCard
          tokenId="1"
          name="Test NFT"
          emoji="😼"
          variant="stake"
          status="alive"
          onStake={onStake}
        />
      );
      
      expect(screen.getByText('STAKE')).toBeInTheDocument();
    });

    it('renders unstake button for staked NFT', () => {
      const onUnstake = jest.fn();
      render(
        <NFTCard
          tokenId="1"
          name="Test NFT"
          emoji="😼"
          variant="stake"
          status="staked"
          isStaked={true}
          onUnstake={onUnstake}
        />
      );
      
      expect(screen.getByText('UNSTAKE')).toBeInTheDocument();
    });

    it('renders pay tax button for audited NFT', () => {
      const onPayTax = jest.fn();
      render(
        <NFTCard
          tokenId="1"
          name="Test NFT"
          emoji="😼"
          variant="stake"
          status="audited"
          onPayTax={onPayTax}
        />
      );
      
      expect(screen.getByText('Pay Tax')).toBeInTheDocument();
    });

    it('renders health bar when health is provided', () => {
      const { container } = render(
        <NFTCard
          tokenId="1"
          name="Test NFT"
          emoji="😼"
          variant="stake"
          status="staked"
          health={50}
        />
      );
      
      // Check if ProgressBar is rendered
      const progressBar = container.querySelector('.bar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Default Variant', () => {
    it('renders default card with image', () => {
      render(
        <NFTCard
          tokenId="1"
          imageUrl="https://example.com/nft.png"
          isStaked={false}
          isDead={false}
          attributes={[]}
          estimatedPoints={10}
        />
      );
      
      expect(screen.getByText('NFT #1')).toBeInTheDocument();
      expect(screen.getByAltText('NFT #1')).toBeInTheDocument();
    });

    it('renders staked status with shield icon', () => {
      render(
        <NFTCard
          tokenId="1"
          imageUrl="https://example.com/nft.png"
          isStaked={true}
          isDead={false}
          attributes={[]}
          estimatedPoints={10}
        />
      );
      
      expect(screen.getByText('🛡️')).toBeInTheDocument();
      expect(screen.getByText('⚡ STAKED')).toBeInTheDocument();
    });

    it('renders dead status', () => {
      render(
        <NFTCard
          tokenId="1"
          imageUrl="https://example.com/nft.png"
          isStaked={false}
          isDead={true}
          attributes={[]}
          estimatedPoints={0}
        />
      );
      
      expect(screen.getByText('💀 DEAD')).toBeInTheDocument();
    });

    it('renders attributes', () => {
      render(
        <NFTCard
          tokenId="1"
          imageUrl="https://example.com/nft.png"
          isStaked={false}
          isDead={false}
          attributes={[
            { trait_type: 'Background', value: 'Blue' },
            { trait_type: 'Eyes', value: 'Laser' },
          ]}
          estimatedPoints={10}
        />
      );
      
      expect(screen.getByText('Background: Blue')).toBeInTheDocument();
      expect(screen.getByText('Eyes: Laser')).toBeInTheDocument();
    });
  });
});
