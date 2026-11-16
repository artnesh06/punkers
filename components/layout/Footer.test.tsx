import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders footer with brand logo', () => {
    render(<Footer />);
    const logo = screen.getByText('PUNKERS');
    expect(logo).toBeInTheDocument();
  });

  it('renders footer tagline', () => {
    render(<Footer />);
    const tagline = screen.getByText(/The most brutal NFT survival game/i);
    expect(tagline).toBeInTheDocument();
  });

  it('renders chain status badge', () => {
    render(<Footer />);
    const status = screen.getByText('CHAIN LIVE');
    expect(status).toBeInTheDocument();
  });

  it('renders social media buttons', () => {
    render(<Footer />);
    const discordBtn = screen.getByLabelText('Discord');
    const twitterBtn = screen.getByLabelText('Twitter');
    const openseaBtn = screen.getByLabelText('OpenSea');
    const etherscanBtn = screen.getByLabelText('Etherscan');
    
    expect(discordBtn).toBeInTheDocument();
    expect(twitterBtn).toBeInTheDocument();
    expect(openseaBtn).toBeInTheDocument();
    expect(etherscanBtn).toBeInTheDocument();
  });

  it('renders Features column with links', () => {
    render(<Footer />);
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Graveyard')).toBeInTheDocument();
  });

  it('renders Community column with links', () => {
    render(<Footer />);
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Discord Server')).toBeInTheDocument();
    expect(screen.getByText('Twitter / X')).toBeInTheDocument();
  });

  it('renders Live Stats column', () => {
    render(<Footer />);
    expect(screen.getByText('Live Stats')).toBeInTheDocument();
    expect(screen.getByText('Total Punkers')).toBeInTheDocument();
    expect(screen.getByText('$PUNK Supply')).toBeInTheDocument();
    expect(screen.getByText('Survivors')).toBeInTheDocument();
    expect(screen.getByText('Eliminated')).toBeInTheDocument();
  });

  it('renders NEW badges', () => {
    render(<Footer />);
    const badges = screen.getAllByText('NEW');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders SOON badge', () => {
    render(<Footer />);
    const badge = screen.getByText('SOON');
    expect(badge).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    const copyright = screen.getByText(/PUNKERS © 2026/i);
    expect(copyright).toBeInTheDocument();
  });

  it('renders bottom bar links', () => {
    render(<Footer />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders chain badge', () => {
    render(<Footer />);
    const chainBadge = screen.getByText('Ethereum');
    expect(chainBadge).toBeInTheDocument();
  });

  it('renders noise texture overlay', () => {
    const { container } = render(<Footer />);
    const noiseOverlay = container.querySelector('.footerNoise');
    expect(noiseOverlay).toBeInTheDocument();
  });

  it('renders 4-column grid layout', () => {
    const { container } = render(<Footer />);
    const grid = container.querySelector('.footerGrid');
    expect(grid).toBeInTheDocument();
  });
});
