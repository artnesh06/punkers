'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from '@/styles/game.module.css';

export default function Treasury() {
  const [treasuryData, setTreasuryData] = useState({
    balance: '0',
    totalCollected: '0',
    totalDistributed: '0',
    pendingRewards: '0',
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allocation, setAllocation] = useState({
    leaderboardRewards: 40,
    nftBuybacks: 30,
    communityEvents: 20,
    developmentFund: 10,
  });

  useEffect(() => {
    loadTreasuryData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [txPage]);

  const loadTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions/recent?page=${txPage}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
        if (data.pagination) {
          setTxTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadTreasuryData = async () => {
    setLoading(true);
    try {
      // Fetch treasury data from API
      const response = await fetch('/api/treasury');

      if (response.ok) {
        const data = await response.json();
        setTreasuryData({
          balance: data.balance || '0',
          totalCollected: data.totalCollected || '0',
          totalDistributed: data.totalDistributed || '0',
          pendingRewards: data.pendingRewards || '0',
        });

        // Set allocation if provided by API
        if (data.allocation) {
          setAllocation(data.allocation);
        }
      } else {
        // If API not available yet, show zeros
        setTreasuryData({
          balance: '0',
          totalCollected: '0',
          totalDistributed: '0',
          pendingRewards: '0',
        });
      }
    } catch (error) {
      console.error('Error loading treasury data:', error);
      // Fallback to zeros on error
      setTreasuryData({
        balance: '0',
        totalCollected: '0',
        totalDistributed: '0',
        pendingRewards: '0',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page} style={{ display: 'block' }}>
      <div className={styles.panel}>
        <h1 className={styles.panelTitle}>🏦 COMMUNITY TREASURY</h1>
        <p
          style={{
            fontSize: '16px',
            marginBottom: '20px',
            color: 'var(--dim)',
          }}
        >
          All audit taxes and penalties are collected here. Funds are used for
          rewards, buybacks, and community initiatives.
        </p>

        <div className={styles.sg}>
          <div className={styles.sc}>
            <div className={styles.lb}>CURRENT BALANCE</div>
            <div className={styles.vl} style={{ color: 'var(--gold)' }}>
              {treasuryData.balance} $PUNK
            </div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>TOTAL COLLECTED</div>
            <div className={styles.vl} style={{ color: 'var(--green)' }}>
              {treasuryData.totalCollected} $PUNK
            </div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>TOTAL DISTRIBUTED</div>
            <div className={styles.vl}>{treasuryData.totalDistributed} $PUNK</div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>PENDING REWARDS</div>
            <div className={styles.vl} style={{ color: 'var(--gold)' }}>
              {treasuryData.pendingRewards} $PUNK
            </div>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>💰 FUND ALLOCATION</h2>
        <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <div className={styles.fi}>
            <span style={{ color: 'var(--dim)' }}>Leaderboard Rewards:</span>
            <span style={{ color: 'var(--gold)' }}>
              {allocation.leaderboardRewards}%
            </span>
          </div>
          <div className={styles.fi}>
            <span style={{ color: 'var(--dim)' }}>NFT Buybacks:</span>
            <span style={{ color: 'var(--green)' }}>
              {allocation.nftBuybacks}%
            </span>
          </div>
          <div className={styles.fi}>
            <span style={{ color: 'var(--dim)' }}>Community Events:</span>
            <span style={{ color: 'var(--blue)' }}>
              {allocation.communityEvents}%
            </span>
          </div>
          <div className={styles.fi}>
            <span style={{ color: 'var(--dim)' }}>Development Fund:</span>
            <span>{allocation.developmentFund}%</span>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <div className={styles.pbar}>
            <div
              className={styles.pfill}
              style={{ width: `${allocation.leaderboardRewards}%` }}
            ></div>
            <div className={styles.ptxt}>
              REWARDS: {allocation.leaderboardRewards}%
            </div>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>📜 RECENT TRANSACTIONS</h2>

        {loading ? (
          <LoadingSpinner message="Loading transactions..." size="small" />
        ) : transactions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--dim)',
              fontSize: '16px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
            <p>No transactions yet</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx, index) => (
              <div key={tx.id || index} className={styles.lbr}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', marginBottom: '4px' }}>
                    {tx.icon || (tx.type === 'deposit' ? '📥' : '📤')} {tx.description}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--dim)' }}>
                    {tx.timeAgo || new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: tx.color || (tx.type === 'deposit' ? 'var(--green)' : 'var(--red)'),
                  }}
                >
                  {tx.points !== undefined ? (
                    <>{tx.points > 0 ? '+' : ''}{tx.points} $PUNK</>
                  ) : (
                    <>{tx.type === 'deposit' ? '+' : '-'}{tx.amount} $PUNK</>
                  )}
                </div>
              </div>
            ))}
            {txTotalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                padding: '14px', borderTop: '1px solid var(--border-color)', marginTop: '12px',
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

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>ℹ️ TREASURY INFO</h2>
        <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <h3
            style={{
              color: 'var(--green)',
              fontSize: '18px',
              marginBottom: '12px',
            }}
          >
            Revenue Sources
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: '24px' }}>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}
              >
                💰
              </span>
              Audit taxes paid by players
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}
              >
                💰
              </span>
              Penalty fees for rule violations
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}
              >
                💰
              </span>
              Early unstaking penalties
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}
              >
                💰
              </span>
              Special event entry fees
            </li>
          </ul>

          <h3
            style={{
              color: 'var(--green)',
              fontSize: '18px',
              marginBottom: '12px',
            }}
          >
            Distribution Methods
          </h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Weekly leaderboard rewards
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Monthly NFT buyback programs
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Community-voted initiatives
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Special event prizes
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>🗳️ GOVERNANCE</h2>
        <div
          style={{ fontSize: '16px', lineHeight: '1.8', color: 'var(--dim)' }}
        >
          <p style={{ marginBottom: '16px' }}>
            Treasury allocation and distribution are governed by the community.
            Top stakers have voting rights on treasury proposals.
          </p>
          <p>
            <strong style={{ color: 'var(--text)' }}>Voting Power:</strong>{' '}
            Based on total points and staking duration
          </p>
        </div>
      </div>

      <div
        className={styles.panel}
        style={{
          background: 'rgba(255, 215, 0, 0.05)',
          borderColor: 'var(--gold)',
        }}
      >
        <h2 className={styles.panelTitle}>🔒 SECURITY</h2>
        <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Multi-signature wallet protection
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Time-locked withdrawals
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Audited smart contracts
            </li>
            <li
              style={{
                marginBottom: '12px',
                paddingLeft: '20px',
                position: 'relative',
              }}
            >
              <span
                style={{ position: 'absolute', left: 0, color: 'var(--green)' }}
              >
                ✓
              </span>
              Transparent on-chain tracking
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
