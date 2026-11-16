'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { GAME } from '@/lib/constants/game';
import { formatNumber } from '@/lib/utils/formatNumber';

interface HomeStats {
  survivors: number;
  graveyard: number;
  day: number;
  taxRate: number;
  treasury: string;
  taxToday: string;
  progressPercent: number;
  isGameActive: boolean;
}

// Gallery items for the home page carousel
const allGalleryItems = [
  { label: 'Punker #1', image: '/images/sneakpeak/IMG_8059.PNG' },
  { label: 'Punker #2', image: '/images/sneakpeak/IMG_8060.PNG' },
  { label: 'Punker #3', image: '/images/sneakpeak/IMG_8061.PNG' },
  { label: 'Punker #4', image: '/images/sneakpeak/IMG_8062.PNG' },
  { label: 'Punker #5', image: '/images/sneakpeak/IMG_8063.PNG' },
  { label: 'Punker #6', image: '/images/sneakpeak/IMG_8064.PNG' },
  { label: 'Punker #7', image: '/images/sneakpeak/IMG_8065.PNG' },
  { label: 'Punker #8', image: '/images/sneakpeak/IMG_8066.PNG' },
  { label: 'Punker #9', image: '/images/sneakpeak/IMG_8067.PNG' },
  { label: 'Punker #10', image: '/images/sneakpeak/IMG_8069.PNG' },
  { label: 'Punker #11', image: '/images/sneakpeak/IMG_8070.PNG' },
  { label: 'Punker #12', image: '/images/sneakpeak/IMG_8071.PNG' },
  { label: 'Punker #13', image: '/images/sneakpeak/IMG_8072.PNG' },
  { label: 'Punker #14', image: '/images/sneakpeak/IMG_8073.PNG' },
  { label: 'Punker #15', image: '/images/sneakpeak/IMG_8074.PNG' },
  { label: 'Punker #16', image: '/images/sneakpeak/IMG_8075.PNG' },
  { label: 'Punker #17', image: '/images/sneakpeak/IMG_8076.PNG' },
  { label: 'Punker #18', image: '/images/sneakpeak/IMG_8077.PNG' },
  { label: 'Punker #19', image: '/images/sneakpeak/IMG_8079.PNG' },
  { label: 'Punker #20', image: '/images/sneakpeak/IMG_8094.PNG' },
];

export default function Home() {
  const trackRef = useRef<HTMLDivElement>(null);
  const galleryIndexRef = useRef(0);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [stats, setStats] = useState<HomeStats>({
    survivors: 0,
    graveyard: 0,
    day: 0,
    taxRate: 0,
    treasury: '0',
    taxToday: '0',
    progressPercent: 0,
    isGameActive: false,
  });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  // Fetch game stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching game stats...');
        const res = await fetch('/api/game/state');
        console.log('Response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('Game state data:', data);
          
          const gameState = data.gameState;
          if (gameState) {
            const newStats = {
              survivors: gameState.survivorsRemaining || 0,
              graveyard: gameState.totalDead || 0,
              day: gameState.currentGameDay || 0,
              taxRate: gameState.currentTaxRate || 0,
              treasury: formatNumber(gameState.treasuryBalance || 0),
              taxToday: formatNumber(gameState.taxCollectedToday || 0),
              progressPercent: gameState.progressPercent || 0,
              isGameActive: gameState.isGameActive || false,
            };
            console.log('Setting stats:', newStats);
            setStats(newStats);
          } else {
            console.log('No gameState in response');
          }
        } else {
          console.error('Failed to fetch game state, status:', res.status);
        }
      } catch (error) {
        console.error('Error fetching game stats:', error);
      }
    };
    
    // Fetch immediately
    fetchStats();
    
    // Then refresh every 10 seconds for testing (change to 30s later)
    const interval = setInterval(() => {
      console.log('Refreshing stats...');
      fetchStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-slide gallery every 2 seconds
  useEffect(() => {
    const interval = setInterval(homeGallerySlide, 2000);
    return () => clearInterval(interval);
  }, []);

  // Random glitch variation every 3 seconds
  useEffect(() => {
    const glitchVariations = [
      'glitchMain',
      'glitchShake', 
      'glitchDiagonal',
      'glitchFlicker',
      'glitchDistort'
    ];

    const changeGlitch = () => {
      if (titleRef.current) {
        const randomGlitch = glitchVariations[Math.floor(Math.random() * glitchVariations.length)];
        titleRef.current.style.animation = `${randomGlitch} 3.5s infinite`;
      }
    };

    const interval = setInterval(changeGlitch, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent transactions
  useEffect(() => {
    fetch(`/api/transactions/recent?page=${txPage}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) {
          setRecentTx(data.transactions);
        }
        if (data.pagination) {
          setTxTotalPages(data.pagination.totalPages);
        }
      })
      .catch(() => {});
  }, [txPage]);

  const homeGallerySlide = () => {
    const track = trackRef.current;
    if (!track) return;

    const cards = track.querySelectorAll('.nft-card');
    if (cards.length === 0) return;

    galleryIndexRef.current++;
    const isMobile = window.innerWidth <= 768;
    const gap = isMobile ? 8 : 12;
    const cardW = (cards[0] as HTMLElement).offsetWidth + gap;
    
    // Mobile slides 2 cards at a time, desktop slides 1 card
    const slideAmount = isMobile ? 2 : 1;

    track.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1)';
    track.style.transform = `translateX(-${galleryIndexRef.current * cardW * slideAmount}px)`;

    // When we reach clones (8 real cards), jump back silently
    // For mobile: 8 cards / 2 = 4 slides, for desktop: 8 slides
    const maxSlides = isMobile ? 4 : 8;
    if (galleryIndexRef.current >= maxSlides) {
      setTimeout(() => {
        track.style.transition = 'none';
        galleryIndexRef.current = 0;
        track.style.transform = 'translateX(0)';
      }, 510);
    }
  };

  return (
    <div className="main">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-glitch-scanline"></div>
        <h1><span ref={titleRef} data-text="PUNKERS SURVIVAL">PUNKERS SURVIVAL</span></h1>
        <p>The future will be shaped by those who give a fuck. raw ink. raw code. raw energy. raw punk.</p>
      </section>

      {/* GAME STATS BAR — below hero tagline */}
      <div className="home-stats-bar" style={{ marginBottom: '32px' }}>
        <div className="home-stat-item" data-tip="Total Punkers in existence">
          <span className="home-stat-prefix">Punkers</span>
          <span className="home-stat-val white">{GAME.totalNFTs.toLocaleString()}</span>
        </div>
        <div className="home-stat-item" data-tip="Still alive & staked">
          <span className="home-stat-prefix">Survivors</span>
          <span className="home-stat-val green">{formatNumber(stats.survivors)}</span>
        </div>
        <div className="home-stat-item" data-tip="Executed — tax not paid">
          <span className="home-stat-prefix">Graveyard</span>
          <span className="home-stat-val red">{formatNumber(stats.graveyard)}</span>
        </div>
        <div className="home-stat-item" data-tip="Current game day">
          <span className="home-stat-prefix">Day</span>
          <span className="home-stat-val yellow">{stats.day}</span>
        </div>
      </div>

      {/* HOME GALLERY: 4 cards, auto-slide every 2s */}
      <div className="home-gallery-wrap">
        <div className="home-gallery-track" id="homeGalleryTrack" ref={trackRef}>
          {/* Render items twice for seamless infinite loop */}
          {[...allGalleryItems, ...allGalleryItems].map((item, index) => (
            <div key={`nft-${item.label}-${index}`} className="nft-card" style={{ cursor: 'pointer' }}>
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="nft-image"
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 25vw"
              />
              <div className="nft-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Second stats bar — 2 columns like HTML */}
      <div className="home-stats-bar" style={{ marginBottom: '20px', marginTop: '20px', gridTemplateColumns: '1fr 1fr' }}>
        <div className="home-stat-item" data-tip="Accumulated from taxes & penalties">
          <span className="home-stat-prefix">Treasury</span>
          <span className="home-stat-val green">{stats.treasury} $PUNK</span>
        </div>
        <div className="home-stat-item" data-tip="Total tax collected today">
          <span className="home-stat-prefix">Tax Today</span>
          <span className="home-stat-val green">{stats.taxToday} $PUNK</span>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.progressPercent}%` }}></div>
          <div className="progress-text">{stats.progressPercent}%</div>
        </div>
      </div>

      {/* Warning Box */}
      <div className="warning-box">
        <div className="warning-avatar">
          <Image 
            src="/images/face.png" 
            alt="Warning" 
            width={80} 
            height={80}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="warning-content">
          <h3><span style={{ display: 'inline-block', transform: 'translateY(-1px)' }}>⚠️</span> Warning</h3>
          <p>This is a stakes game. Your Punkers may face audits, penalties, and even death. Only the most strategic players will survive and claim the ultimate rewards.</p>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="transactions-section">
        <h3>Recent Transactions</h3>
        {recentTx.length === 0 ? (
          <div className="transactions-empty">
            <div className="empty-icon">📭</div>
            <div>No transactions yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentTx.map((tx: any) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 14px',
                fontSize: '14px', fontFamily: 'var(--font-mono)',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{ fontSize: '18px', color: tx.color, marginRight: '10px' }}>
                  {tx.icon}
                </span>
                <span style={{ flex: 1 }}>
                  {tx.description}
                </span>
                <span style={{ textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {tx.timeAgo}
                </span>
              </div>
            ))}
            {txTotalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                padding: '14px', borderTop: '1px solid var(--border-color)',
              }}>
                <button
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px',
                    padding: '6px 14px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)', color: txPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: txPage === 1 ? 'not-allowed' : 'pointer', opacity: txPage === 1 ? 0.4 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                  {txPage} / {txTotalPages}
                </span>
                <button
                  onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                  disabled={txPage === txTotalPages}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '1px',
                    padding: '6px 14px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)', color: txPage === txTotalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: txPage === txTotalPages ? 'not-allowed' : 'pointer', opacity: txPage === txTotalPages ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
