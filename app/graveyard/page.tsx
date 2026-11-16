'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { formatNumber } from '@/lib/utils/formatNumber';
import { useToast } from '@/lib/hooks/useToast';
import NFTModal from '@/components/game/NFTModal';
import gyStyles from './graveyard.module.css';

type LayoutOption = 'grid3' | 'grid2' | 'grid4' | 'list' | 'list-detail';

interface GameState {
  gameStartDate: string;
  currentGameDay: number;
  totalDead: number;
  survivorsRemaining: number;
}

interface DeadNFT {
  tokenId: string;
  metadata?: { name?: string; image?: string };
  causeOfDeath?: string;
  deathDate?: string;
  daysAlive?: number;
  pointsLost?: number;
  penaltiesPaid?: number;
  ownerAddress?: string;
  killedBy?: string;
  executedDay?: number;
  flowerCount?: number;
  isRecent?: boolean;
}

export default function Graveyard() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [deadNFTs, setDeadNFTs] = useState<DeadNFT[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [mode, setMode] = useState<'global' | 'personal'>('global');
  const [activeLayout, setActiveLayout] = useState<LayoutOption>('grid3');
  const [searchQuery, setSearchQuery] = useState('');
  const [personalCount, setPersonalCount] = useState(0);
  const [clickedFlowers, setClickedFlowers] = useState<Set<string>>(new Set());
  // NFT Modal state
  const [selectedNFT, setSelectedNFT] = useState<DeadNFT | null>(null);
  const [isNFTModalOpen, setIsNFTModalOpen] = useState(false);

  useEffect(() => {
    loadGameState();
    loadDeadNFTs(mode);
    // Load personal count for display
    if (address) {
      loadPersonalCount();
    }
  }, [isConnected, address, mode]);

  const loadPersonalCount = async () => {
    if (!address) {
      setPersonalCount(0);
      return;
    }
    try {
      const response = await fetch(`/api/nft/dead?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setPersonalCount(data.deadNFTs?.length || 0);
      }
    } catch (error) {
      console.error('Error loading personal count:', error);
    }
  };

  const loadGameState = async () => {
    try {
      const response = await fetch('/api/game/state');
      if (response.ok) {
        const data = await response.json();
        setGameState(data.gameState);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  const loadDeadNFTs = async (fetchMode: 'global' | 'personal') => {
    if (fetchMode === 'personal' && !address) {
      setDeadNFTs([]);
      return;
    }

    setLoading(true);
    try {
      const url = fetchMode === 'personal' ? `/api/nft/dead?address=${address}` : `/api/nft/dead`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setDeadNFTs(data.deadNFTs || []);
      } else {
        console.error('Failed to fetch dead NFTs');
        setDeadNFTs([]);
      }
    } catch (error) {
      console.error('Error loading dead NFTs:', error);
      setDeadNFTs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search query
  const filteredNFTs = deadNFTs.filter((nft) => {
    if (!searchQuery) return true;
    const name = nft.metadata?.name || `Punker #${nft.tokenId}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.tokenId.includes(searchQuery);
  });

  // Pagination
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = filteredNFTs.slice(startIndex, endIndex);

  const goToPage = (page: number) => setCurrentPage(page);

  // Stats
  const totalDeaths = deadNFTs.length;
  const totalFlowers = deadNFTs.reduce((sum, nft) => sum + (nft.flowerCount || 0), 0);
  const currentDay = gameState?.currentGameDay || 0;
  const recentDeaths = deadNFTs.filter((nft) => nft.isRecent !== false).length;

  const handleFlower = (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation();

    // Optimistic update — increment immediately in UI
    setDeadNFTs(prev => prev.map(nft =>
      nft.tokenId === tokenId
        ? { ...nft, flowerCount: (nft.flowerCount || 0) + 1 }
        : nft
    ));

    // Fire and forget — backend handles it asynchronously
    fetch('/api/nft/flower', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId, address: address?.toLowerCase() }),
    }).then(res => {
      if (!res.ok) {
        // Revert on failure
        setDeadNFTs(prev => prev.map(nft =>
          nft.tokenId === tokenId
            ? { ...nft, flowerCount: Math.max(0, (nft.flowerCount || 0) - 1) }
            : nft
        ));
      }
    }).catch(() => {
      setDeadNFTs(prev => prev.map(nft =>
        nft.tokenId === tokenId
          ? { ...nft, flowerCount: Math.max(0, (nft.flowerCount || 0) - 1) }
          : nft
      ));
    });

    // Clicked animation
    setClickedFlowers(prev => new Set(prev).add(tokenId));

    // Animations
    const button = e.currentTarget as HTMLButtonElement;
    const ripple = document.createElement('div');
    ripple.className = 'flowerRipple';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);

    const rect = button.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const petals = ['🌸', '🌺', '🌼', '🌷', '💐', '🌹'];
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.textContent = petals[Math.floor(Math.random() * petals.length)];
        petal.style.cssText = `
          left: ${cx + (Math.random() - 0.5) * 40}px;
          top: ${cy}px;
          --dx: ${(Math.random() - 0.5) * 100}px;
          --rot: ${(Math.random() - 0.5) * 360}deg;
        `;
        document.body.appendChild(petal);
        setTimeout(() => petal.remove(), 1500);
      }, i * 60);
    }

    const floatingFlower = document.createElement('div');
    floatingFlower.textContent = '🌸';
    floatingFlower.className = gyStyles.flowerFloat;
    floatingFlower.style.position = 'fixed';
    floatingFlower.style.left = `${rect.left + rect.width / 2}px`;
    floatingFlower.style.top = `${rect.top}px`;
    floatingFlower.style.zIndex = '1000';
    document.body.appendChild(floatingFlower);
    setTimeout(() => {
      if (document.body.contains(floatingFlower)) {
        document.body.removeChild(floatingFlower);
      }
    }, 2000);

    setTimeout(() => {
      setClickedFlowers(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenId);
        return newSet;
      });
    }, 600);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const layoutClassMap: Record<LayoutOption, string | undefined> = {
    grid3: gyStyles.grid3,
    grid2: gyStyles.grid2,
    grid4: gyStyles.grid4,
    list: gyStyles.list,
    'list-detail': gyStyles.listDetail || gyStyles['list-detail'],
  };

  return (
    <div className={gyStyles.page}>
      <div className={gyStyles.panel}>
        {/* Section Header — matches HTML section-header */}
        <section className={gyStyles.sectionHeader}>
          <h1 style={{ color: 'var(--accent-red)' }}>Graveyard</h1>
          <p>Rest in peace. These Punkers didn&apos;t make it.</p>
        </section>

        {/* Stats Bar — matches HTML stake-stats pattern */}
        <div className={gyStyles.statsGrid}>
          <div className={gyStyles.statCard}>
            <div className={gyStyles.statLabel}>TOTAL DEATHS</div>
            <div className={`${gyStyles.statValue} ${gyStyles.red}`}>{formatNumber(totalDeaths)}</div>
          </div>
          <div className={gyStyles.statCard}>
            <div className={gyStyles.statLabel}>TOTAL FLOWERS</div>
            <div className={`${gyStyles.statValue} ${gyStyles.white}`}>{formatNumber(totalFlowers)}</div>
          </div>
          <div className={gyStyles.statCard}>
            <div className={gyStyles.statLabel}>DAYS</div>
            <div className={`${gyStyles.statValue} ${gyStyles.white}`}>{currentDay > 0 ? currentDay : '—'}</div>
          </div>
          <div className={gyStyles.statCard}>
            <div className={gyStyles.statLabel}>24H DEATHS</div>
            <div className={`${gyStyles.statValue} ${gyStyles.red}`}>{formatNumber(recentDeaths)}</div>
          </div>
        </div>

      {/* Filter Controls */}
      <div className={gyStyles.controlsRow}>
        <div className={gyStyles.modeTabs}>
          <button className={`${gyStyles.modeTab} ${mode === 'global' ? gyStyles.active : ''}`} onClick={() => { setMode('global'); setCurrentPage(1); }}>All ({deadNFTs.length})</button>
          <button className={`${gyStyles.modeTab} ${mode === 'personal' ? gyStyles.active : ''}`} onClick={() => { setMode('personal'); setCurrentPage(1); }} disabled={!isConnected}>My Graveyard ({personalCount})</button>
        </div>
        <div className={gyStyles.showingCount}>{filteredNFTs.length > 0 ? `showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredNFTs.length)} of ${filteredNFTs.length} punkers` : 'no punkers found'}</div>
      </div>

      <div className={gyStyles.toolbar}>
        <input className={gyStyles.search} type="text" placeholder="Search Punker #..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
        <div className={gyStyles.layoutBtns}>
          <button className={`${gyStyles.layoutBtn} ${activeLayout === 'grid3' ? gyStyles.active : ''}`} title="Grid 3" onClick={() => setActiveLayout('grid3')}>
            <svg viewBox="0 0 16 16"><path d="M1,1h4v4H1zM6,1h4v4H6zM11,1h4v4h-4zM1,6h4v4H1zM6,6h4v4H6zM11,6h4v4h-4zM1,11h4v4H1zM6,11h4v4H6zM11,11h4v4h-4z" /></svg>
          </button>
          <button className={`${gyStyles.layoutBtn} ${activeLayout === 'grid2' ? gyStyles.active : ''}`} title="Grid 2" onClick={() => setActiveLayout('grid2')}>
            <svg viewBox="0 0 16 16"><path d="M1,1h6v6H1zM9,1h6v6H9zM1,9h6v6H1zM9,9h6v6H9z" /></svg>
          </button>
          <button className={`${gyStyles.layoutBtn} ${activeLayout === 'grid4' ? gyStyles.active : ''}`} title="Grid 4" onClick={() => setActiveLayout('grid4')}>
            <svg viewBox="0 0 16 16"><path d="M1,1h3v5H1zM5,1h3v5H5zM9,1h3v5H9zM13,1h3v5h-3zM1,8h3v5H1zM5,8h3v5H5zM9,8h3v5H9zM13,8h3v5h-3z" /></svg>
          </button>
          <button className={`${gyStyles.layoutBtn} ${activeLayout === 'list' ? gyStyles.active : ''}`} title="List" onClick={() => setActiveLayout('list')}>
            <svg viewBox="0 0 16 16"><path d="M5,2h10v2H5zM1,2h3v2H1zM5,7h10v2H5zM1,7h3v2H1zM5,12h10v2H5zM1,12h3v2H1z" /></svg>
          </button>
          <button className={`${gyStyles.layoutBtn} ${activeLayout === 'list-detail' ? gyStyles.active : ''}`} title="List Detail" onClick={() => setActiveLayout('list-detail')}>
            <svg viewBox="0 0 16 16"><path d="M1,1h14v4H1zM1,6h14v4H1zM1,11h14v4H1z" /></svg>
          </button>
        </div>
      </div>

      {/* NFT Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '18px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading graveyard...</p>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '18px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💀</div>
          <p>No deaths yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--accent-green)' }}>
            {mode === 'global' ? 'All Punkers are surviving!' : 'All your Punkers are still alive!'}
          </p>
        </div>
      ) : (
        <>
          <div className={`${gyStyles.nftGrid} ${layoutClassMap[activeLayout] || gyStyles.grid3}`}>
            {currentNFTs.map((nft) => {
              const nftName = nft.metadata?.name || `Punker #${nft.tokenId}`;
              const executedDay = nft.executedDay || nft.daysAlive || 0;
              const killedBy = nft.killedBy || nft.ownerAddress || '';

              return (
                <div 
                  key={nft.tokenId} 
                  className={gyStyles.gyCard}
                  onClick={() => { setSelectedNFT(nft); setIsNFTModalOpen(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  {nft.isRecent && <div className={gyStyles.recentDot} />}
                  <div className={gyStyles.gyCardAvatar}>
                    {nft.metadata?.image ? (
                      <>
                        <img src={nft.metadata.image} alt={nftName} />
                        <div className={gyStyles.deadOverlay}>💀</div>
                      </>
                    ) : (
                      <div className={gyStyles.deadOverlay}>💀</div>
                    )}
                  </div>
                  <div className={gyStyles.gyCardInfo}>
                    <div className={gyStyles.gyCardName}>{nftName}</div>
                    <div className={gyStyles.gyCardStatus}>
                      Status: <span className={gyStyles.gyBadgeRip}>🪦 RIP</span>
                    </div>
                    <div className={gyStyles.gyCardTimer}>
                      Executed Day {executedDay}
                    </div>
                    {killedBy && (
                      <div className={gyStyles.gyCardKilledBy}>
                        Killed by <span>{formatAddress(killedBy)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    className={`${gyStyles.flowerBtn} ${clickedFlowers.has(nft.tokenId) ? gyStyles.clicked : ''} `}
                    onClick={(e) => handleFlower(e, nft.tokenId)}
                  >
                    🌸 <span className={gyStyles.flowerCount}>{nft.flowerCount || 0}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={gyStyles.pagination}>
              <button
                className={gyStyles.pageBtn}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      className={`${gyStyles.pageBtn} ${page === currentPage ? gyStyles.active : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className={`${gyStyles.pageBtn} ${gyStyles.dots}`}>...</span>
                  );
                }
                return null;
              })}

              <button
                className={gyStyles.pageBtn}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Ghost Portal Section — matches HTML ghost-wrap */}
      <div className={gyStyles.ghostPortal}>
        <div className={gyStyles.ghostWrap}>
          <div className={gyStyles.ghostComingSoonLarge}>
            GHOST PORTAL COMING SOON
          </div>
        </div>
      </div>
      </div>

      {/* NFT Modal */}
      <NFTModal 
        nft={selectedNFT}
        isOpen={isNFTModalOpen}
        onClose={() => { setIsNFTModalOpen(false); setSelectedNFT(null); }}
      />
    </div>
  );
}
