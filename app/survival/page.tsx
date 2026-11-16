'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/lib/hooks/useToast';
import GameOverBanner from '@/components/game/GameOverBanner';
import NFTModal from '@/components/game/NFTModal';
import CertificateModal from '@/components/game/CertificateModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { determineNFTRarity, getCurrentEarning, getPersonalStakeDay } from '@/lib/services/game-engine';
import { GAME } from '@/lib/constants/game';
import { formatNumber } from '@/lib/utils/formatNumber';
import styles from './survival.module.css';

interface GameState {
  gameStartDate: string;
  currentGameDay: number;
  currentTaxRate: number;
  totalAlive: number;
  totalDead: number;
  survivorsRemaining: number;
  isGameActive: boolean;
  isGameComplete?: boolean;
}

interface SurvivalStats {
  commonAlive: number;
  epicAlive: number;
  legendaryAlive: number;
  artAlive: number;
  totalExecutions: number;
  totalAudits: number;
  totalKills: number;
}

interface BountyTarget {
  tokenId: string;
  owner: string;
  hoursOverdue: number;
  status: string;  // UNPAID | AUDITED | EXECUTABLE
  bountyReward: number;
  countdownSeconds?: number;  // seconds left for AUDITED state
  lastAudit?: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  nftCount: number;
  audits: number;
  executions: number;
  pfpUrl?: string;
}

type FilterTab = 'all' | 'alive' | 'audited';
type LayoutOption = 'grid3' | 'grid2' | 'grid4' | 'list' | 'listDetail';

const LAYOUT_ICONS: { key: LayoutOption; title: string; d: string }[] = [
  { key: 'grid3', title: 'Grid 3', d: 'M1,1h4v4H1zM6,1h4v4H6zM11,1h4v4h-4zM1,6h4v4H1zM6,6h4v4H6zM11,6h4v4h-4zM1,11h4v4H1zM6,11h4v4H6zM11,11h4v4h-4z' },
  { key: 'grid2', title: 'Grid 2', d: 'M1,1h6v6H1zM9,1h6v6H9zM1,9h6v6H1zM9,9h6v6H9z' },
  { key: 'grid4', title: 'Grid 4', d: 'M1,1h3v5H1zM5,1h3v5H5zM9,1h3v5H9zM13,1h3v5h-3zM1,8h3v5H1zM5,8h3v5H5zM9,8h3v5H9zM13,8h3v5h-3z' },
  { key: 'list', title: 'List', d: 'M5,2h10v2H5zM1,2h3v2H1zM5,7h10v2H5zM1,7h3v2H1zM5,12h10v2H5zM1,12h3v2H1z' },
  { key: 'listDetail', title: 'List Detail', d: 'M1,1h14v4H1zM1,6h14v4H1zM1,11h14v4H1z' },
];

const LB_BADGES = [
  { label: '★ TOP PUNK', bg: 'var(--accent-red)', color: '#fff', gradient: 'linear-gradient(135deg,#e53030,#ff6600)', border: 'var(--accent-red)', vc: 'var(--accent-yellow)', emoji: '👾', vl: (e: LeaderboardEntry) => `${formatNumber(e.points)} $PUNK` },
  { label: '★ TOP HOLDERS', bg: 'var(--accent-green)', color: '#000', gradient: 'linear-gradient(135deg,#00c853,#004d20)', border: 'var(--accent-green)', vc: 'var(--accent-green)', emoji: '🦊', vl: (e: LeaderboardEntry) => `${e.nftCount} NFTs` },
  { label: '★ TOP AUDITS', bg: 'var(--accent-orange)', color: '#000', gradient: 'linear-gradient(135deg,#ff6600,#7a2e00)', border: 'var(--accent-orange)', vc: 'var(--accent-orange)', emoji: '🕵️', vl: (e: LeaderboardEntry) => `${e.audits || 0} Audits` },
  { label: '★ TOP POINTS', bg: '#7b2fff', color: '#fff', gradient: 'linear-gradient(135deg,#7b2fff,#2a0066)', border: '#7b2fff', vc: '#a78bfa', emoji: '👑', vl: (e: LeaderboardEntry) => `${formatNumber(e.points)} pts` },
  { label: '★ TOP EXECUTED', bg: '#880000', color: '#fff', gradient: 'linear-gradient(135deg,#880000,#2a0000)', border: '#880000', vc: 'var(--accent-red)', emoji: '💀', vl: (e: LeaderboardEntry) => `${e.executions || 0} Kills` },
];

export default function Survival() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const leaderboardTrackRef = useRef<HTMLDivElement>(null);
  const leaderboardIndexRef = useRef(0);

  const [allNFTs, setAllNFTs] = useState<any[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [survivalStats, setSurvivalStats] = useState<SurvivalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bountyTargets, setBountyTargets] = useState<BountyTarget[]>([]);
  const [bountyAction, setBountyAction] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<LayoutOption>('grid3');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    loadGameState();
    loadAllNFTs();
    loadBountyTargets();
    loadLeaderboard();
  }, [isConnected, address]);

  // Auto-slide leaderboard every 4 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      leaderboardSlide();
    }, 4000);

    return () => clearInterval(slideInterval);
  }, []);

  // Handle window resize for leaderboard
  useEffect(() => {
    const handleResize = () => {
      leaderboardIndexRef.current = 0;
      if (leaderboardTrackRef.current) {
        leaderboardTrackRef.current.style.transition = 'none';
        leaderboardTrackRef.current.style.transform = '';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const leaderboardSlide = () => {
    const track = leaderboardTrackRef.current;
    if (!track) return;

    const items = track.querySelectorAll('.leaderboardItem');
    if (items.length === 0) return;

    leaderboardIndexRef.current++;
    const itemWidth = (items[0] as HTMLElement).offsetWidth + 12; // 12px gap
    
    track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    track.style.transform = `translateX(-${leaderboardIndexRef.current * itemWidth}px)`;

    // When we reach the duplicated items, jump back silently
    if (leaderboardIndexRef.current >= items.length / 2) {
      setTimeout(() => {
        track.style.transition = 'none';
        leaderboardIndexRef.current = 0;
        track.style.transform = 'translateX(0)';
      }, 610);
    }
  };

  const loadGameState = async () => {
    try {
      const r = await fetch('/api/game/state');
      if (r.ok) { 
        const d = await r.json(); 
        setGameState(d.gameState);
        setSurvivalStats(d.survivalStats);
      }
    } catch (e) { console.error('Error loading game state:', e); }
  };

  const loadAllNFTs = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/nft/survivors');
      if (!r.ok) { setAllNFTs([]); return; }
      const d = await r.json();
      setAllNFTs(d.nfts || []);
    } catch (e) { console.error('Error loading NFTs:', e); setAllNFTs([]); }
    finally { setLoading(false); }
  };

  const loadBountyTargets = async () => {
    try {
      const r = await fetch('/api/game/targets');
      if (r.ok) { const d = await r.json(); setBountyTargets(d.targets || []); }
    } catch (e) { console.error('Error loading targets:', e); }
  };

  const loadLeaderboard = async () => {
    try {
      const r = await fetch('/api/leaderboard/top');
      if (r.ok) {
        const d = await r.json();
        if (d.success && d.top) {
          // Convert top categories to leaderboard entries array for carousel
          const top = d.top;
          const entries: LeaderboardEntry[] = [
            top.topPunk,
            top.topHolders,
            top.topAudits,
            top.topPoints,
            top.topExecutions,
          ].filter(Boolean);
          setLeaderboard(entries);
        }
      }
    } catch (e) { console.error('Error loading leaderboard:', e); }
  };

  const handleAudit = async (tokenId: string) => {
    if (!address) { showToast({ message: 'Connect wallet to audit', type: 'warning' }); return; }
    try {
      setBountyAction(`audit-${tokenId}`);
      const r = await fetch('/api/nft/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorAddress: address.toLowerCase(), targetTokenId: tokenId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to audit NFT');
      await loadBountyTargets();
      showToast({ message: `Audited NFT #${tokenId}! +${d.data?.auditorReward || GAME.bountyReward} $PUNK`, type: 'success' });
    } catch (e: any) { showToast({ message: e.message || 'Failed to audit NFT', type: 'error' }); }
    finally { setBountyAction(null); }
  };

  const handleExecute = async (tokenId: string) => {
    if (!address) { showToast({ message: 'Connect wallet to execute', type: 'warning' }); return; }
    try {
      setBountyAction(`execute-${tokenId}`);
      const r = await fetch('/api/nft/kill', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executorAddress: address.toLowerCase(), targetTokenId: tokenId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to execute NFT');
      await loadBountyTargets();
      showToast({ message: `Executed NFT #${tokenId}! +${d.data?.executorReward || GAME.bountyReward} $PUNK`, type: 'success' });
    } catch (e: any) { showToast({ message: e.message || 'Failed to execute NFT', type: 'error' }); }
    finally { setBountyAction(null); }
  };

  const bountyMap = useMemo(() => {
    const map = new Map<string, BountyTarget>();
    bountyTargets.forEach(t => map.set(t.tokenId, t));
    return map;
  }, [bountyTargets]);

  const enrichedNFTs = useMemo(() => allNFTs.map(nft => {
    const rarity = determineNFTRarity(nft.tokenId, nft.metadata?.attributes);
    const bounty = bountyMap.get(nft.tokenId);
    // 4 states: alive → unpaid → audited → executable
    let gameStatus: 'alive' | 'unpaid' | 'audited' | 'executable' = 'alive';
    if (bounty) {
      if (bounty.status === 'EXECUTABLE') gameStatus = 'executable';
      else if (bounty.status === 'AUDITED') gameStatus = 'audited';
      else if (bounty.status === 'UNPAID') gameStatus = 'unpaid';
    }
    
    // Always calculate from traits for accuracy
    const personalStakeDay = nft.stakedAt 
      ? getPersonalStakeDay(new Date(nft.stakedAt))
      : 1;
    const estimatedPoints = getCurrentEarning(personalStakeDay, rarity);
    
    return { ...nft, rarity, gameStatus, bounty, estimatedPoints };
  }), [allNFTs, bountyMap]);

  const filteredNFTs = useMemo(() => {
    let result = enrichedNFTs;
    if (filterTab === 'alive') result = result.filter(n => n.gameStatus === 'alive');
    else if (filterTab === 'audited') result = result.filter(n => n.gameStatus === 'unpaid' || n.gameStatus === 'audited' || n.gameStatus === 'executable');
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(n => (n.tokenId?.toString().toLowerCase() || '').includes(q) || (n.metadata?.name?.toLowerCase() || '').includes(q));
    }
    return result;
  }, [enrichedNFTs, filterTab, searchTerm]);

  const aliveCount = useMemo(() => enrichedNFTs.filter(n => n.gameStatus === 'alive').length, [enrichedNFTs]);
  const auditedCount = useMemo(() => enrichedNFTs.filter(n => n.gameStatus !== 'alive').length, [enrichedNFTs]);
  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const currentNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filterTab, searchTerm]);
  const goToPage = (page: number) => setCurrentPage(page);

  const getGridClass = () => {
    const map: Record<LayoutOption, string> = { grid3: styles.grid3, grid2: styles.grid2, grid4: styles.grid4, list: styles.list, listDetail: styles.listDetail };
    return `${styles.nftGrid} ${map[layout] || styles.grid3}`;
  };

  const shortenAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

  const lbItems = useMemo(() => {
    if (leaderboard.length === 0) return [];

    // leaderboard array is already ordered: [topPunk, topHolders, topAudits, topPoints, topExecutions]
    return LB_BADGES.map((b, i) => {
      const entry = leaderboard[i];
      if (!entry) return null;
      return { ...b, entry };
    }).filter(Boolean);
  }, [leaderboard]);

  const handleProfileClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.entry?.address) return;
    window.location.href = `/profile?address=${item.entry.address}`;
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h1>Survivors</h1>
          <p>These are your active Punkers that are still in the game and earning points.</p>
        </div>

        {/* Leaderboard Banner Carousel */}
        {lbItems.length > 0 && (
          <div className={styles.leaderboardBanner}>
            <div className={styles.leaderboardTrack} ref={leaderboardTrackRef}>
              {[...lbItems, ...lbItems].map((item, i) => (
                <div key={`lb-${i}`} className={`${styles.leaderboardItem} leaderboardItem`}>
                  <span className={styles.leaderboardBadge} style={{ background: item.bg, color: item.color }}>{item.label}</span>
                  <div 
                    className={styles.leaderboardAvatar} 
                    style={{ background: item.gradient, border: `2px solid ${item.border}`, boxShadow: `0 0 16px ${item.border}33`, cursor: 'pointer', overflow: 'hidden' }}
                    onClick={(e) => handleCertificateClick(item, e)}
                    title="View Certificate"
                  >
                    {item.entry.pfpUrl ? (
                      <img src={item.entry.pfpUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    ) : item.emoji}
                  </div>
                  <div 
                    className={styles.leaderboardName}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleCertificateClick(item, e)}
                    title="View Certificate"
                  >
                    {shortenAddr(item.entry.address)}
                  </div>
                <div className={styles.leaderboardValue} style={{ color: item.vc }}>{item.vl(item.entry)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats — Total Survivors, Total Deaths, Total Audit, Total Kill */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Survivors</div><div className={`${styles.statValue} ${styles.green}`}>{gameState?.survivorsRemaining ?? allNFTs.length}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Deaths</div><div className={`${styles.statValue} ${styles.red}`}>{survivalStats?.totalExecutions ?? gameState?.totalDead ?? 0}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Audit</div><div className={`${styles.statValue} ${styles.yellow}`}>{survivalStats?.totalAudits ?? 0}</div></div>
        <div className={styles.statCard}><div className={styles.statLabel}>Total Kill</div><div className={`${styles.statValue} ${styles.red}`}>{survivalStats?.totalKills ?? 0}</div></div>
      </div>

      {gameState?.isGameComplete && <GameOverBanner isGameComplete={true} />}

      {/* Filter Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.filterTabs}>
          <button className={`${styles.filterTab} ${filterTab === 'all' ? styles.active : ''}`} onClick={() => setFilterTab('all')}>All ({enrichedNFTs.length})</button>
          <button className={`${styles.filterTab} ${filterTab === 'alive' ? styles.active : ''}`} onClick={() => setFilterTab('alive')}>Alive ({aliveCount})</button>
          <button className={`${styles.filterTab} ${filterTab === 'audited' ? styles.active : ''}`} onClick={() => setFilterTab('audited')}>Audited ({auditedCount})</button>
        </div>
        <div className={styles.showingCount}>{filteredNFTs.length > 0 ? `showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredNFTs.length)} of ${filteredNFTs.length} punkers` : 'no punkers found'}</div>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.search} type="text" placeholder="Search Punker #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className={styles.layoutBtns}>
          {LAYOUT_ICONS.map(l => (
            <button key={l.key} className={`${styles.layoutBtn} ${layout === l.key ? styles.active : ''}`} title={l.title} onClick={() => setLayout(l.key)}>
              <svg viewBox="0 0 16 16"><path d={l.d} /></svg>
            </button>
          ))}
        </div>
      </div>

        {loading ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>⏳</div><p>Loading survivors...</p></div>
        ) : filteredNFTs.length === 0 ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>⚔️</div><p>No punkers match your search</p></div>
        ) : (<>
          <div className={getGridClass()}>
            {currentNFTs.map(nft => {
              const isUnpaid = nft.gameStatus === 'unpaid';
              const isAudited = nft.gameStatus === 'audited';
              const isExecutable = nft.gameStatus === 'executable';
              const cardCls = [styles.survivorCard, (isUnpaid || isAudited) && styles.audited, isExecutable && styles.executable].filter(Boolean).join(' ');
              const cardBorderColor = isExecutable ? '#ff4400' : isAudited ? 'var(--accent-red)' : isUnpaid ? 'var(--accent-orange)' : undefined;
              const avatarBorderColor = cardBorderColor;
              // Health: alive=100%, unpaid=30%, audited=15%, executable=5%
              const health = isExecutable ? '5%' : isAudited ? '15%' : isUnpaid ? '30%' : '100%';
              const healthColor = isExecutable ? '#ff4400' : isAudited ? 'var(--accent-red)' : isUnpaid ? 'var(--accent-orange)' : undefined;

              return (
                <div key={nft.tokenId} className={cardCls} style={cardBorderColor ? { borderColor: cardBorderColor } : undefined} onClick={() => { setSelectedNFT({ ...nft, currentGameDay: gameState?.currentGameDay }); setIsModalOpen(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedNFT({ ...nft, currentGameDay: gameState?.currentGameDay }); setIsModalOpen(true); } }}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardAvatar} style={avatarBorderColor ? { borderColor: avatarBorderColor } : undefined}>
                      {nft.metadata?.image ? <img src={nft.metadata.image} alt={nft.metadata?.name || `#${nft.tokenId}`} /> : '🎭'}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{nft.metadata?.name || `Punker #${nft.tokenId}`}</div>
                      <div className={styles.cardStakedDate}>Staked: <span>{nft.stakedAt ? new Date(nft.stakedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span></div>
                      <div className={styles.cardStatus}>Status: <span className={`${styles.statusBadge} ${styles[nft.gameStatus]}`}>
                        {nft.gameStatus === 'alive' && '✓ ALIVE'}
                        {nft.gameStatus === 'unpaid' && '⚠️ UNPAID'}
                        {nft.gameStatus === 'audited' && '🔍 AUDITED'}
                        {nft.gameStatus === 'executable' && '⚡ EXECUTE'}
                      </span></div>
                      <div className={styles.cardPoints}>Points: <span>{nft.estimatedPoints ?? 0}</span> · Health: <span style={healthColor ? { color: healthColor } : undefined}>{health}</span></div>
                    </div>
                  </div>
                  {/* State 2: UNPAID → "Audit" button */}
                  {isUnpaid && isConnected && (
                    <button className={`${styles.actionBtn} ${styles.audit}`} disabled={bountyAction === `audit-${nft.tokenId}`} onClick={(e) => { e.stopPropagation(); handleAudit(nft.tokenId); }}>
                      {bountyAction === `audit-${nft.tokenId}` ? '⏳ Auditing...' : 'Audit'}
                    </button>
                  )}
                  {/* State 3: AUDITED → countdown timer "⏱ Pay within XX:XX:XX" */}
                  {isAudited && (
                    <button className={`${styles.actionBtn} ${styles.pay}`} disabled onClick={(e) => e.stopPropagation()}>
                      ⏱ Pay within <span className={styles.countdown}>{formatCountdown(nft.bounty?.countdownSeconds ?? 0)}</span>
                    </button>
                  )}
                  {/* State 4: EXECUTABLE → "⚔️ Execute" button (filled red) */}
                  {isExecutable && isConnected && (
                    <button className={`${styles.actionBtn} ${styles.executeFilled}`} disabled={bountyAction === `execute-${nft.tokenId}`} onClick={(e) => { e.stopPropagation(); handleExecute(nft.tokenId); }}>
                      {bountyAction === `execute-${nft.tokenId}` ? '⏳ Executing...' : '⚔️ Execute'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return <button key={page} className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`} onClick={() => goToPage(page)}>{page}</button>;
                }
                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className={styles.dots}>...</span>;
                return null;
              })}
              <button className={styles.pageBtn} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}
        </>)}

      </div>

      <NFTModal nft={selectedNFT} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedNFT(null); }} />
      
      <CertificateModal 
        address={selectedAddress} 
        isOpen={isCertificateModalOpen} 
        onClose={() => { setIsCertificateModalOpen(false); setSelectedAddress(null); }} 
      />
    </div>
  );
}
