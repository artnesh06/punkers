'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { GAME } from '@/lib/constants/game';
import GrowthChart from '@/components/charts/GrowthChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils/formatNumber';
import styles from './ranks.module.css';

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  nftCount: number;
  level: number;
  audits: number;
  executions: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  hasMore: boolean;
}

interface TreasuryData {
  balance: string;
  stats: {
    totalTaxPayments: number;
    totalPenalties: number;
    totalForfeited: number;
    totalBounties: number;
    survivorsRemaining: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  points: number;
  description: string;
  userAddress: string;
  icon: string;
  color: string;
  timeAgo: string;
}

interface GameState {
  currentGameDay: number;
  currentTaxRate: number;
  survivorsRemaining: number;
  totalDead: number;
}

const ITEMS_PER_PAGE = 20;

export default function Ranks() {
  const { address, isConnected } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1, totalPages: 1, totalEntries: 0, hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState<Pagination>({
    currentPage: 1, totalPages: 1, totalEntries: 0, hasMore: false,
  });

  const loadLeaderboard = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);
      const data = await response.json();
      setEntries(data.entries || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTreasury = async () => {
    try {
      const response = await fetch('/api/treasury');
      if (response.ok) {
        const data = await response.json();
        setTreasury(data);
      }
    } catch (error) {
      console.error('Error loading treasury:', error);
    }
  };

  const loadTransactions = async (txPageNum: number = 1) => {
    try {
      const response = await fetch(`/api/transactions/recent?page=${txPageNum}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        if (data.pagination) setTxPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
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

  const loadUserPoints = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/points/total?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.totalPoints || 0);
      }
    } catch (error) {
      console.error('Error loading user points:', error);
    }
  };

  useEffect(() => {
    loadLeaderboard(page);
    loadTreasury();
    loadTransactions(txPage);
    loadGameState();
  }, [page, txPage, loadLeaderboard]);

  useEffect(() => {
    if (isConnected && address) loadUserPoints();
  }, [isConnected, address]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadLeaderboard(page);
      loadTreasury();
      loadTransactions(txPage);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, loadLeaderboard]);

  const goToPage = (p: number) => {
    if (p < 1 || p > pagination.totalPages || p === page) return;
    setPage(p);
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCurrentUser = (entryAddress: string) => {
    return isConnected && address?.toLowerCase() === entryAddress.toLowerCase();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getLevelTitle = (points: number) => {
    if (points >= 2000) return { title: 'INFERNO WARLORD', color: '#ff8800' };
    if (points >= 1000) return { title: 'GOLD ELITE', color: '#ffd040' };
    if (points >= 500) return { title: 'SILVER WARRIOR', color: '#a0a0a0' };
    if (points >= 200) return { title: 'BRONZE SURVIVOR', color: '#c8922a' };
    return { title: 'ACTIVE PUNKER', color: '#3a3a3a' };
  };

  const poolBalance = treasury ? parseInt(treasury.balance) + 5000000 : 5000000;
  const survivorsCount = treasury?.stats?.survivorsRemaining || gameState?.survivorsRemaining || 0;
  const perSurvivor = survivorsCount > 0 ? Math.floor(poolBalance / survivorsCount) : 0;
  const fromTax = treasury?.stats?.totalTaxPayments || 0;
  const fromPenalties = (treasury?.stats?.totalPenalties || 0) + (treasury?.stats?.totalForfeited || 0);

  // Find user rank
  const userEntry = entries.find(e => isCurrentUser(e.address));
  const userRank = userEntry?.rank || '—';

  // Page numbers
  const getPageNumbers = () => {
    const pages: (number | 'dots')[] = [];
    const total = pagination.totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('dots');
      for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
      if (page < total - 2) pages.push('dots');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className={styles.page}>
      <div className={styles.pool}>
        <div className={styles.poolLabel}>Total $PUNK Pool</div>
        <div className={styles.poolValue}>
          {poolBalance.toLocaleString()} <span className={styles.punkLabel}>$PUNK</span>
        </div>
      </div>

      {/* Pool Stats */}
      <div className={styles.poolStats}>
        <div className={styles.poolStat}>
          <div className={styles.statLabel}>Per Survivor</div>
          <div className={`${styles.statValue} ${styles.yellow}`}>{formatNumber(perSurvivor)}</div>
        </div>
        <div className={styles.poolStat}>
          <div className={styles.statLabel}>From Tax</div>
          <div className={styles.statValue}>{formatNumber(fromTax)}</div>
        </div>
        <div className={styles.poolStat}>
          <div className={styles.statLabel}>From Penalties</div>
          <div className={styles.statValue}>{formatNumber(fromPenalties)}</div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className={styles.growthSection}>
        <div className={styles.growthHeader}>
          <div className={styles.growthTitle}>Growth</div>
        </div>
        <div className={styles.growthChart}>
          <GrowthChart />
        </div>
      </div>

      {/* Leaderboard */}
      <div className={styles.leaderboardSection}>
        <div className={styles.leaderboardHeader}>
          <div className={styles.lbTitle}>Leaderboard</div>
          <button className={styles.refreshBtn} onClick={() => loadLeaderboard(page)}>
            ↺ REFRESH
          </button>
        </div>
        <div className={styles.lbSubtitle}>
          Top players ranked by total points.
        </div>

        {/* LB Stats */}
        <div className={styles.lbStats}>
          <div className={styles.lbStat}>
            <div className={styles.statLabel}>Total Players</div>
            <div className={styles.statValue}>{formatNumber(pagination.totalEntries)}</div>
          </div>
          <div className={styles.lbStat}>
            <div className={styles.statLabel}>Your Rank</div>
            <div className={`${styles.statValue} ${styles.yellow}`}>{userRank}</div>
          </div>
          <div className={styles.lbStat}>
            <div className={styles.statLabel}>Your $PUNK</div>
            <div className={styles.statValue}>{formatNumber(userPoints)}</div>
          </div>
          <div className={styles.lbStat}>
            <div className={styles.statLabel}>Day</div>
            <div className={`${styles.statValue} ${styles.yellow}`}>{gameState?.currentGameDay ?? '—'}</div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.lbTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Address</th>
                <th>Level</th>
                <th style={{ textAlign: 'right' }}>$PUNK</th>
                <th style={{ textAlign: 'right' }}>NFTs</th>
                <th style={{ textAlign: 'right' }}>Audits</th>
                <th style={{ textAlign: 'right' }}>Exec</th>
                <th style={{ textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <LoadingSpinner message="Loading leaderboard..." size="small" />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    🏆 No entries yet
                  </td>
                </tr>
              ) : (
                entries.map(entry => {
                  const isSelf = isCurrentUser(entry.address);
                  const rankIcon = getRankIcon(entry.rank);
                  const levelInfo = getLevelTitle(entry.points);
                  return (
                    <tr key={`${entry.rank}-${entry.address}`} className={isSelf ? styles.youRow : ''}>
                      <td>
                        {rankIcon && <span className={styles.rankIcon}>{rankIcon}</span>}
                        {' '}{entry.rank}
                      </td>
                      <td>
                        <div className={styles.addressCell}>
                          <div className={styles.addressAvatar}>💀</div>
                          <span>{shortenAddress(entry.address)}</span>
                          {isSelf && <span className={styles.youBadge}>YOU</span>}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '8px', color: levelInfo.color, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                        {levelInfo.title}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>{formatNumber(entry.points)}</td>
                      <td style={{ textAlign: 'right' }}>{entry.nftCount}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-yellow)' }}>{entry.audits}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-red)' }}>{entry.executions}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-green)' }}>{formatNumber(entry.points)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.lbEnd}>🏁 Top {ITEMS_PER_PAGE} shown · Page {page}/{pagination.totalPages || 1}</div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button className={styles.pageBtn} onClick={() => goToPage(page - 1)} disabled={page === 1}>
              ← Prev
            </button>
            {getPageNumbers().map((p, i) =>
              p === 'dots' ? (
                <span key={`dots-${i}`} className={styles.dots}>...</span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.active : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button className={styles.pageBtn} onClick={() => goToPage(page + 1)} disabled={page === pagination.totalPages}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className={styles.transactionsSection}>
        <h3 className={styles.transactionsTitle}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className={styles.txEmpty}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>📋</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <>
            <div className={styles.txList}>
              {transactions.map(tx => (
                <div key={tx.id} className={styles.txRow}>
                  <div className={styles.txIcon}>{tx.icon}</div>
                  <div className={styles.txInfo}>
                    <div className={styles.txDesc}>{tx.description}</div>
                    <div className={styles.txTime}>{tx.timeAgo}</div>
                  </div>
                  <div className={styles.txAmount} style={{ color: tx.color }}>
                    {tx.points > 0 ? '+' : ''}{tx.points} $PUNK
                  </div>
                </div>
              ))}
            </div>
            {txPagination.totalPages > 1 && (
              <div className={styles.pagination} style={{ marginTop: '16px' }}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                >
                  ← Prev
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                  {txPage} / {txPagination.totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setTxPage(p => Math.min(txPagination.totalPages, p + 1))}
                  disabled={txPage === txPagination.totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
