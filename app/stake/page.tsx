'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/lib/hooks/useToast';
import { formatNumber } from '@/lib/utils/formatNumber';
import FilterTabs from '@/components/features/FilterTabs';
import LayoutSwitcher, {
  type LayoutOption,
} from '@/components/features/LayoutSwitcher';
import NFTCard from '@/components/game/NFTCard';
import NFTModal from '@/components/game/NFTModal';
import GameOverBanner from '@/components/game/GameOverBanner';
import { getNFTStatus, getCurrentEarning, determineNFTRarity, getPersonalStakeDay } from '@/lib/services/game-engine';
import { GAME } from '@/lib/constants/game';
import styles from '@/styles/game.module.css';
import stakeStyles from './stake.module.css';

export default function Stake() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingTax, setPayingTax] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'staked' | 'audited' | 'rip'
  >('all');
  const [activeLayout, setActiveLayout] = useState<LayoutOption>('grid3');
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [gameState, setGameState] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Track if user is a participant (has entered the game)
  const [isParticipant, setIsParticipant] = useState(false);
  // NFT Modal state
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isNFTModalOpen, setIsNFTModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadGameState();
      loadNFTs();
      loadTotalPoints();
    }
  }, [isConnected, address]);

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

  const loadTotalPoints = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/points/total?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setTotalPoints(data.totalPoints || 0);
      }
    } catch (error) {
      console.error('Error loading total points:', error);
    }
  };

  const loadNFTs = async () => {
    if (!address) return;
    setLoading(true);
    try {
      // 1. Fetch all wallet NFTs from API (pagination handled server-side)
      const nftResponse = await fetch(`/api/nft/list?address=${address}`);
      if (!nftResponse.ok) throw new Error('Failed to fetch NFTs');
      const nftData = await nftResponse.json();
      const userNFTs = nftData.nfts || [];

      // 2. Fetch staking records from DB
      const stakingResponse = await fetch(`/api/staking/status?address=${address}`);
      const stakingData = stakingResponse.ok
        ? await stakingResponse.json()
        : { stakedNFTs: [] };
      let stakedNFTs = stakingData.stakedNFTs || [];

      // User is a participant if they have at least one staked NFT in DB
      const hasStaked = stakedNFTs.length > 0;
      setIsParticipant(hasStaked);

      // 3. Auto-register new NFTs if user is already a participant
      // This handles NFTs bought after entering the game
      if (hasStaked) {
        const aliveNFTs = userNFTs.filter((nft: any) => !nft.isDead);
        const stakedTokenIds = new Set(stakedNFTs.map((s: any) => s.tokenId));
        const newTokenIds = aliveNFTs
          .map((nft: any) => nft.tokenId)
          .filter((tokenId: string) => !stakedTokenIds.has(tokenId));

        if (newTokenIds.length > 0) {
          // Auto-register new NFTs via stake-all endpoint
          try {
            const regResponse = await fetch('/api/staking/stake-all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: address.toLowerCase(), tokenIds: newTokenIds }),
            });
            if (regResponse.ok) {
              // Re-fetch staking status to get updated records
              const refreshResponse = await fetch(`/api/staking/status?address=${address}`);
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                stakedNFTs = refreshData.stakedNFTs || stakedNFTs;
              }
            }
          } catch (regError) {
            console.warn('Auto-registration of new NFTs failed (non-blocking):', regError);
          }
        }
      }

      // 4. Build NFT list for display
      // Exclude dead NFTs — they belong in the graveyard, not here
      const aliveNFTs = userNFTs.filter((nft: any) => !nft.isDead);

      const nftsWithStatus = aliveNFTs.map((nft: any) => {
        const stakedInfo = stakedNFTs.find((s: any) => s.tokenId === nft.tokenId);
        const isRegisteredInDB = !!stakedInfo;

        return {
          ...nft,
          // Soft-staking: if participant, all wallet NFTs are in-game
          isStaked: hasStaked,
          isRegisteredInDB,
          // New NFT = in wallet but no DB record yet (needs lazy registration)
          isNewNFT: hasStaked && !isRegisteredInDB,
          stakedAt: stakedInfo?.stakedAt || null,
          lastTaxPayment: stakedInfo?.lastTaxPayment || null,
          lastClaimDate: stakedInfo?.lastClaimDate || null,
          estimatedPoints: (() => {
            // Always calculate from traits (from OpenSea via /api/nft/list) for accuracy
            const rarity = determineNFTRarity(nft.tokenId, nft.metadata?.attributes);
            const personalDay = stakedInfo?.stakedAt
              ? getPersonalStakeDay(new Date(stakedInfo.stakedAt))
              : 1;
            return getCurrentEarning(personalDay, rarity);
          })(),
        };
      });

      setNfts(nftsWithStatus);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lazy-register an NFT that's in wallet but not yet in DB.
   * Called before pay-tax or claim on a new NFT.
   */
  const ensureRegistered = async (tokenId: string): Promise<boolean> => {
    const nft = nfts.find((n) => n.tokenId === tokenId);
    if (!nft?.isNewNFT) return true; // Already registered

    try {
      const response = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address!.toLowerCase(), tokenId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to register NFT');
      }
      return true;
    } catch (error: any) {
      console.error('Failed to lazy-register NFT:', error);
      showToast({ message: error.message || 'Failed to register NFT', type: 'error' });
      return false;
    }
  };

  const handlePayTax = async (tokenId: string) => {
    if (!address) return;
    try {
      setPayingTax(tokenId);

      // Lazy-register if needed
      const registered = await ensureRegistered(tokenId);
      if (!registered) return;

      const response = await fetch('/api/staking/pay-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase(), tokenId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to pay tax');
      await loadNFTs();
      await loadTotalPoints();
      const message = data.data?.wasAudited
        ? `Tax paid with penalty! Total: ${data.data.taxPaid} $PUNK`
        : `Tax paid! ${data.data.taxPaid} $PUNK`;
      showToast({ message, type: 'success' });
    } catch (error: any) {
      console.error('Error paying tax:', error);
      showToast({ message: error.message || 'Failed to pay tax.', type: 'error' });
    } finally {
      setPayingTax(null);
    }
  };

  const handleEnterGame = async () => {
    if (!address) return;
    const allNFTs = nfts.filter((nft) => !nft.isDead);
    if (allNFTs.length === 0) {
      showToast({ message: 'No NFTs found in wallet', type: 'warning' });
      return;
    }
    try {
      setStakingAll(true);
      const tokenIds = allNFTs.map((nft: any) => nft.tokenId);
      const response = await fetch('/api/staking/stake-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase(), tokenIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to enter game');
      await loadNFTs();
      showToast({ message: `⚡ Entered the game with ${data.summary?.staked || tokenIds.length} NFT(s)!`, type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to enter game', type: 'error' });
    } finally {
      setStakingAll(false);
    }
  };

  const [payingAllTax, setPayingAllTax] = useState(false);
  const [stakingAll, setStakingAll] = useState(false);
  const [claimingAll, setClaimingAll] = useState(false);

  const handlePayAllTax = async () => {
    if (!address) return;
    try {
      setPayingAllTax(true);
      const response = await fetch('/api/staking/pay-tax-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to pay all taxes');
      await loadNFTs();
      await loadTotalPoints();
      showToast({ message: data.message || `Paid tax for ${data.data?.paidNFTs?.length || 0} NFT(s)`, type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Failed to pay all taxes', type: 'error' });
    } finally {
      setPayingAllTax(false);
    }
  };

  const handleClaimAll = async () => {
    if (!address) return;
    try {
      setClaimingAll(true);
      const response = await fetch('/api/staking/claim-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to claim earnings');
      await loadNFTs();
      await loadTotalPoints();
      showToast({ message: `Claimed ${data.data.totalClaimed} $PUNK from ${data.data.claimedNFTs.length} NFT(s)!`, type: 'success' });
    } catch (error: any) {
      console.error('Error claiming all earnings:', error);
      showToast({ message: error.message || 'Failed to claim earnings', type: 'error' });
    } finally {
      setClaimingAll(false);
    }
  };

  const filteredNFTs = nfts.filter((nft) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'staked') return nft.isStaked && !nft.isDead;
    if (selectedFilter === 'audited') {
      if (!nft.isStaked || nft.isDead || !nft.isRegisteredInDB) return false;
      const lastPay = nft.lastTaxPayment || nft.stakedAt;
      if (!lastPay) return false;
      const nftStatus = getNFTStatus(new Date(lastPay));
      return nftStatus.status === 'audited' || nftStatus.status === 'executed';
    }
    if (selectedFilter === 'rip') return nft.isDead === true;
    return true;
  });

  // Estimate pending earnings across all staked NFTs (only those registered in DB)
  const earningsInfo = useMemo(() => {
    const now = Date.now();
    let totalPending = 0;
    let totalDailyRate = 0;
    let oldestClaimMs = 0;

    nfts.forEach((nft) => {
      // Skip dead, unregistered, or NFTs without stake info
      if (nft.isDead || !nft.isRegisteredInDB || !nft.stakedAt || !nft.estimatedPoints) return;
      const lastClaim = nft.lastClaimDate ? new Date(nft.lastClaimDate).getTime() : new Date(nft.stakedAt).getTime();
      const msSinceClaim = now - lastClaim;
      const hoursSinceClaim = msSinceClaim / (1000 * 60 * 60);
      totalDailyRate += nft.estimatedPoints;
      if (msSinceClaim > oldestClaimMs) oldestClaimMs = msSinceClaim;
      if (hoursSinceClaim < 1) return;
      totalPending += Math.floor(nft.estimatedPoints * Math.floor(hoursSinceClaim) / 24);
    });

    const hoursSinceOldest = oldestClaimMs / (1000 * 60 * 60);
    const cycleHours = hoursSinceOldest % 24;
    const progressPct = Math.min(100, (cycleHours / 24) * 100);

    return { totalPending, totalDailyRate, progressPct, cycleHours };
  }, [nfts]);

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNFTs = filteredNFTs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const goToPage = (page: number) => setCurrentPage(page);

  if (!isConnected) {
    return (
      <div className={stakeStyles.page}>
        <div className={stakeStyles.lock}>
          <div style={{ fontSize: '64px' }}>🔒</div>
          <h2 style={{ fontSize: '24px', color: 'var(--red)' }}>WALLET NOT CONNECTED</h2>
          <p style={{ fontSize: '16px', color: 'var(--dim)' }}>
            Please connect your wallet to stake your Punkers NFTs
          </p>
        </div>
      </div>
    );
  }

  const getEmptyIcon = () => {
    if (selectedFilter === 'staked') return '⚡';
    if (selectedFilter === 'rip') return '💀';
    return '🖼️';
  };

  const getEmptyMessage = () => {
    if (selectedFilter === 'all') return 'No Punkers NFTs found in your wallet';
    if (selectedFilter === 'staked') return 'No staked NFTs';
    return 'No NFTs in this category';
  };

  // Computed counts
  const stakedCount = nfts.filter((n) => n.isStaked && !n.isDead).length;
  const unstakedCount = nfts.filter((n) => !n.isStaked && !n.isDead).length;
  const newNFTCount = nfts.filter((n) => n.isNewNFT).length;
  const unpaidNFTs = nfts.filter((n) => {
    if (!n.isStaked || n.isDead || !n.isRegisteredInDB) return false;
    const lastPay = n.lastTaxPayment || n.stakedAt;
    if (!lastPay) return false;
    const s = getNFTStatus(new Date(lastPay));
    return s.status === 'audited' || s.status === 'executed';
  });
  const unpaidCount = unpaidNFTs.length;
  const deadCount = nfts.filter((n) => n.isDead).length;

  return (
    <div className={stakeStyles.page}>
      <div className={stakeStyles.panel}>
        <section className={stakeStyles.sectionHeader}>
          <h1>Stake Your Punkers</h1>
          <p>
            Stake your NFTs to start earning points. Pay taxes every {GAME.auditGracePeriodHours} hours to keep earning.
          </p>
        </section>

        <div className={stakeStyles.statsGrid}>
          <div className={stakeStyles.statCard}>
            <div className={stakeStyles.statLabel}>IN GAME</div>
            <div className={`${stakeStyles.statValue} ${stakeStyles.white}`}>{stakedCount}/{nfts.length}</div>
          </div>
          <div className={stakeStyles.statCard}>
            <div className={stakeStyles.statLabel}>DAILY EARN</div>
            <div className={`${stakeStyles.statValue} ${stakeStyles.green}`}>{earningsInfo.totalDailyRate} $PUNK</div>
          </div>
          <div className={stakeStyles.statCard}>
            <div className={stakeStyles.statLabel}>YOUR BAL</div>
            <div className={`${stakeStyles.statValue} ${stakeStyles.green}`}>{formatNumber(totalPoints)} $PUNK</div>
          </div>
          <div className={stakeStyles.statCard}>
            <div className={stakeStyles.statLabel}>TAX TODAY</div>
            <div className={`${stakeStyles.statValue} ${stakeStyles.red}`}>{gameState?.currentTaxRate || 3} $PUNK</div>
          </div>
        </div>

        <GameOverBanner isGameComplete={!!gameState?.isGameComplete} />

        {/* ENTER GAME button — only shown if user has NOT entered yet */}
        {!gameState?.isGameComplete && !isParticipant && nfts.length > 0 && (
          <div className={stakeStyles.actionRow}>
            <button
              className={stakeStyles.actionBtnYellow}
              onClick={handleEnterGame}
              disabled={stakingAll}
              style={{ width: '100%' }}
            >
              <span className={stakeStyles.actionBtnTitle}>
                {stakingAll ? '⏳ ENTERING...' : '⚡ ENTER GAME'}
              </span>
              <span className={stakeStyles.actionBtnSub}>
                Stake all {nfts.length} NFTs and join the survival game
              </span>
            </button>
          </div>
        )}

        {/* Action Buttons for participants: CLAIM ALL + PAY ALL TAX */}
        {!gameState?.isGameComplete && isParticipant && (earningsInfo.totalPending > 0 || unpaidCount > 0) && (
          <div className={stakeStyles.actionRow}>
            {earningsInfo.totalPending > 0 && (
              <button
                className={stakeStyles.actionBtnGreen}
                onClick={handleClaimAll}
                disabled={claimingAll}
              >
                <span className={stakeStyles.actionBtnTitle}>
                  {claimingAll ? '⏳ CLAIMING...' : '💰 CLAIM ALL'}
                </span>
                <span className={stakeStyles.actionBtnSub}>
                  {earningsInfo.totalPending} $PUNK pending
                </span>
              </button>
            )}
            {unpaidCount > 0 && (
              <button
                className={stakeStyles.actionBtnRed}
                onClick={handlePayAllTax}
                disabled={payingAllTax}
              >
                <span className={stakeStyles.actionBtnTitle}>
                  {payingAllTax ? '⏳ PAYING...' : '⚠️ PAY ALL TAX'}
                </span>
                <span className={stakeStyles.actionBtnSub}>
                  <span className={stakeStyles.unpaidNum}>{unpaidCount}</span> unpaid
                </span>
              </button>
            )}
          </div>
        )}

        {/* New NFT notification for participants */}
        {isParticipant && newNFTCount > 0 && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: 'var(--yellow, #ffc107)',
            fontSize: '14px',
          }}>
            🆕 {newNFTCount} new NFT(s) detected in your wallet — they are automatically in the game! Tax timer starts when you first interact (pay tax or claim).
          </div>
        )}

        {/* Filter and Layout Controls */}
        <div className={stakeStyles.controlsRow}>
          <div className={stakeStyles.filterSection}>
            <FilterTabs
              options={
                isParticipant
                  ? [
                      { value: 'all', label: `All (${nfts.length})` },
                      { value: 'audited', label: `Unpaid (${unpaidCount})` },
                      { value: 'rip', label: `RIP (${deadCount})` },
                    ]
                  : [
                      { value: 'all', label: `All (${nfts.length})` },
                      { value: 'staked', label: `Staked (${stakedCount})` },
                      { value: 'audited', label: `Unpaid (${unpaidCount})` },
                      { value: 'rip', label: `RIP (${deadCount})` },
                    ]
              }
              activeFilter={selectedFilter}
              onFilterChange={(filter) =>
                setSelectedFilter(filter as 'all' | 'staked' | 'audited' | 'rip')
              }
            />
          </div>
          <div className={stakeStyles.layoutSection}>
            <LayoutSwitcher activeLayout={activeLayout} onLayoutChange={setActiveLayout} />
          </div>
        </div>

        {!loading && filteredNFTs.length > 0 && (
          <div className={stakeStyles.showingCount}>
            showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredNFTs.length)} of {filteredNFTs.length} punkers
          </div>
        )}

        {loading ? (
          <div className="vt" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)', fontSize: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>Loading your NFTs...</p>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <div className="vt" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)', fontSize: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{getEmptyIcon()}</div>
            <p>{getEmptyMessage()}</p>
          </div>
        ) : (
          <>
            <div className={`${stakeStyles.nftGrid} ${stakeStyles[activeLayout]}`}>
              {currentNFTs.map((nft) => (
                <NFTCard
                  key={nft.tokenId}
                  tokenId={nft.tokenId}
                  name={nft.metadata?.name || `Punker #${nft.tokenId}`}
                  imageUrl={nft.metadata?.image}
                  emoji={nft.metadata?.emoji}
                  status={nft.isDead ? 'rip' : nft.isStaked ? 'staked' : 'alive'}
                  isStaked={nft.isStaked}
                  health={nft.health}
                  estimatedPoints={nft.estimatedPoints}
                  stakedDate={nft.stakedAt ? new Date(nft.stakedAt).toLocaleDateString() : nft.isNewNFT ? 'New' : undefined}
                  lastTaxPayment={nft.lastTaxPayment ? new Date(nft.lastTaxPayment) : nft.stakedAt ? new Date(nft.stakedAt) : null}
                  gameStartDate={gameState?.gameStartDate ? new Date(gameState.gameStartDate) : null}
                  variant="stake"
                  layout={activeLayout}
                  onClick={() => { 
                    setSelectedNFT({ ...nft, currentGameDay: gameState?.currentGameDay }); 
                    setIsNFTModalOpen(true);
                  }}
                  onPayTax={() => handlePayTax(nft.tokenId)}
                  isPayTaxLoading={payingTax === nft.tokenId}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className={stakeStyles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← PREV
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
                        className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className={`${styles.pageBtn} ${styles.dots}`}>...</span>
                    );
                  }
                  return null;
                })}

                <button
                  className={styles.pageBtn}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  NEXT →
                </button>
              </div>
            )}
          </>
        )}
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
