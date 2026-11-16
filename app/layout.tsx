import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import Ticker from '@/components/layout/Ticker';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import AuroraBackground from '@/components/effects/AuroraBackground';
import GlitchEffect from '@/components/effects/GlitchEffect';
import { GAME } from '@/lib/constants/game';

const gameDesc = `Only ${GAME.survivorTarget} of ${GAME.totalNFTs.toLocaleString()} will survive and they take everything. Earn $PUNK, pay taxes, audit, execute, and have fun!`;

export const metadata: Metadata = {
  title: 'PUNKERS | The NFT Survival Game',
  description: gameDesc,
  keywords: ['NFT', 'Staking', 'Ethereum', 'Punkers', 'Web3', 'Blockchain', 'Survival Game', 'PUNK Token'],
  authors: [{ name: 'Punkers' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://punkers.wtf'),
  
  // Open Graph - untuk Facebook, LinkedIn, Discord, WhatsApp
  openGraph: {
    title: 'PUNKERS | The NFT Survival Game',
    description: gameDesc,
    type: 'website',
    siteName: 'PUNKERS',
    images: [
      {
        url: '/images/Embed.png',
        width: 1200,
        height: 630,
        alt: 'PUNKERS - The NFT Survival Game',
      },
    ],
    locale: 'en_US',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'PUNKERS | The NFT Survival Game',
    description: gameDesc,
    images: ['/images/Embed.png'],
    creator: '@punkers',
    site: '@punkers',
  },
  
  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  
  // Manifest
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuroraBackground />
          <GlitchEffect />
          <div className="vignette"></div>
          <Ticker />
          <Navbar />
          {children}
          <Footer />
          <ScrollToTop />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
