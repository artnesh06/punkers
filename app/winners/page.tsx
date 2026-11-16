'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from '@/styles/game.module.css';

interface Winner {
  rank: number;
  address: string;
  tokenId: string;
  totalPoints: number;
  rarity: string;
  survivedDays: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalWinners: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 50;

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRarityColor(rarity: string): string {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return 'var(--gold)';
    case 'epic':
      return '#a855f7';
    case 'art':
    case '1/1':
      return '#ec4899';
    default:
      return 'var(--dim)';
  }
}

function getRarityLabel(rarity: string): string {
  const r = rarity?.toLowerCase();
  if (r === 'art' || r === '1/1') return '1/1 ART';
  if (r === 'legendary') return 'LEGENDARY';
  if (r === 'epic') return 'EPIC';
  return 'COMMON';
}

export default function Winners() {
  const { address } = useAccount();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState<boolean | null>(null);
  const [endedGameId, setEndedGameId] = useState<string | null>(null);

  // Check if a game has ended by fetching game state
  useEffect(() => {
    async function checkGameState() {
      try {
        const res = await fetch('/api/game/state');
        if (res.ok) {
          const data = await res.json();
          const isComplete = !!data.gameState?.isGameComplete;
          setGameEnded(isComplete);
          // If game is complete, we need the ended game ID for the winners API
          if (isComplete) {
            // The gameState doesn't expose gameId, so we pass no gameId
            // and let the API find the latest ended game
            setEndedGameId(null);
          }
        } else {
          setGameEnded(false);
        }
      } catch {
        setGameEnded(false);
      } finally {
        setLoading(false);
      }
    }
    checkGameState();
  }, []);

  const loadWinners = useCallback(async (page: number) => {
    setLoading(true);
    try {
      let url = `/api/game/winners?page=${page}&limit=${ITEMS_PER_PAGE}`;
      if (endedGameId) {
        url += `&gameId=${endedGameId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWinners(data.winners || []);
        setPagination(data.pagination || null);
        if (!gameEnded) setGameEnded(true);
      } else {
        setWinners([]);
        setPagination(null);
      }
    } catch {
      setWinners([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [endedGameId, gameEnded]);

  // Load winners once we know the game has ended
  useEffect(() => {
    if (gameEnded) {
      loadWinners(currentPage);
    }
  }, [gameEnded, currentPage, loadWinners]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const connectedAddress = address?.toLowerCase();

  // Loading state
  if (loading && gameEnded === null) {
    return (
      <div className={styles.page} style={{ display: 'block' }}>
        <div className={styles.panel}>
          <LoadingSpinner message="Loading..." />
        </div>
      </div>
    );
  }

  // Game still in progress
  if (gameEnded === false) {
    return (
      <div className={styles.page} style={{ display: 'block' }}>
        <div className={styles.panel}>
          <h1 className={styles.panelTitle}>🏆 WINNERS</h1>
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)', fontSize: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
            <p>Game still in progress</p>
            <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--green)' }}>
              The survival game has not ended yet. Winners will be displayed here once the game concludes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className={styles.page} style={{ display: 'block' }}>
      <div className={styles.panel}>
        <h1 className={styles.panelTitle}>🏆 WINNERS</h1>

        {pagination && (
          <div className={styles.sg} style={{ marginBottom: '20px' }}>
            <div className={styles.sc}>
              <div className={styles.lb}>TOTAL WINNERS</div>
              <div className={styles.vl} style={{ color: 'var(--gold)' }}>
                {pagination.totalWinners}
              </div>
            </div>
            <div className={styles.sc}>
              <div className={styles.lb}>PAGE</div>
              <div className={styles.vl} style={{ color: 'var(--green)' }}>
                {pagination.currentPage} / {pagination.totalPages}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)', fontSize: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>Loading winners...</p>
          </div>
        ) : winners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)', fontSize: '18px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p>No winners found</p>
          </div>
        ) : (
          <>
            <div className={styles.gc}>
              {winners.map((winner) => {
                const isOwn = connectedAddress && winner.address?.toLowerCase() === connectedAddress;
                return (
                  <div
                    key={`${winner.tokenId}-${winner.rank}`}
                    className={styles.cc}
                    style={isOwn ? {
                      borderColor: 'var(--gold)',
                      boxShadow: '0 0 12px rgba(255, 215, 0, 0.2)',
                    } : undefined}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: winner.rank <= 3 ? 'var(--gold)' : 'var(--dim)',
                      }}>
                        #{winner.rank}
                      </span>
                      {isOwn && (
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--gold)',
                          border: '1px solid var(--gold)',
                          padding: '2px 8px',
                          letterSpacing: '1px',
                        }}>
                          YOU
                        </span>
                      )}
                    </div>

                    <div className={styles.fi}>
                      <span style={{ color: 'var(--dim)' }}>Address:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px', color: isOwn ? 'var(--gold)' : 'var(--text)' }}>
                        {shortenAddress(winner.address)}
                      </span>
                    </div>
                    <div className={styles.fi}>
                      <span style={{ color: 'var(--dim)' }}>Token ID:</span>
                      <span>{winner.tokenId}</span>
                    </div>
                    <div className={styles.fi}>
                      <span style={{ color: 'var(--dim)' }}>Total Points:</span>
                      <span style={{ color: 'var(--green)' }}>{winner.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className={styles.fi}>
                      <span style={{ color: 'var(--dim)' }}>Rarity:</span>
                      <span style={{
                        color: getRarityColor(winner.rarity),
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontSize: '13px',
                      }}>
                        {getRarityLabel(winner.rarity)}
                      </span>
                    </div>
                    <div className={styles.fi}>
                      <span style={{ color: 'var(--dim)' }}>Survived Days:</span>
                      <span>{winner.survivedDays}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
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
    </div>
  );
}
