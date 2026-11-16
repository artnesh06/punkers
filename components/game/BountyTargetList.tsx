'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { GAME } from '@/lib/constants/game';
import styles from './BountyTargetList.module.css';

interface BountyTarget {
  tokenId: string;
  owner: string;
  ownerShort: string;
  hoursOverdue: number;
  taxDue: number;
  penalty: number;
  totalDue: number;
  status: string;
  bountyReward: number;
}

export default function BountyTargetList() {
  const { address } = useAccount();
  const [targets, setTargets] = useState<BountyTarget[]>([]);
  const [filter, setFilter] = useState<'audit' | 'execute'>('audit');
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadTargets();
    // Refresh every 30 seconds
    const interval = setInterval(loadTargets, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bounty/targets?type=${filter}`);
      const data = await res.json();
      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error loading targets:', error);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async (tokenId: string) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setActionInProgress(tokenId);

      const res = await fetch('/api/nft/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditorAddress: address.toLowerCase(),
          targetTokenId: tokenId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to audit');
      }

      alert(`✅ Successfully audited NFT #${tokenId}! You earned ${data.data.auditorReward} $PUNK`);
      await loadTargets();
    } catch (error: any) {
      console.error('Error auditing:', error);
      alert(error.message || 'Failed to audit NFT');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExecute = async (tokenId: string) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setActionInProgress(tokenId);

      const res = await fetch('/api/nft/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executorAddress: address.toLowerCase(),
          targetTokenId: tokenId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute');
      }

      alert(`💀 Successfully executed NFT #${tokenId}! You earned ${data.data.executorReward} $PUNK`);
      await loadTargets();
    } catch (error: any) {
      console.error('Error executing:', error);
      alert(error.message || 'Failed to execute NFT');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🎯</span>
          <h2>Bounty Targets</h2>
        </div>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'audit' ? styles.active : ''}`}
            onClick={() => setFilter('audit')}
          >
            <span className={styles.tabIcon}>🔍</span>
            <span>AUDIT (24h+)</span>
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'execute' ? styles.active : ''}`}
            onClick={() => setFilter('execute')}
          >
            <span className={styles.tabIcon}>⚔️</span>
            <span>EXECUTE (48h+)</span>
          </button>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Targets Found:</span>
          <span className={styles.infoValue}>{targets.length}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Bounty Reward:</span>
          <span className={styles.infoValue}>+{GAME.bountyReward} $PUNK</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingIcon}>⏳</div>
          <p>Loading targets...</p>
        </div>
      ) : targets.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {filter === 'audit' ? '🔍' : '⚔️'}
          </div>
          <p>No targets available for {filter}</p>
          <span className={styles.emptyHint}>
            {filter === 'audit' 
              ? 'NFTs that are 24+ hours overdue will appear here'
              : 'NFTs that are 48+ hours overdue will appear here'}
          </span>
        </div>
      ) : (
        <div className={styles.grid}>
          {targets.map((target) => (
            <div key={target.tokenId} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.tokenId}>NFT #{target.tokenId}</div>
                <div className={styles.status}>
                  {target.status === 'AUDITED' && '🔍 AUDITED'}
                  {target.status === 'EXECUTED' && '💀 EXECUTED'}
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.row}>
                  <span className={styles.label}>Owner:</span>
                  <span className={styles.value}>{target.ownerShort}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Overdue:</span>
                  <span className={`${styles.value} ${styles.danger}`}>
                    {Math.floor(target.hoursOverdue)}h
                  </span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Tax Due:</span>
                  <span className={styles.value}>{target.taxDue} $PUNK</span>
                </div>
                {target.penalty > 0 && (
                  <div className={styles.row}>
                    <span className={styles.label}>Penalty:</span>
                    <span className={`${styles.value} ${styles.warning}`}>
                      +{target.penalty} $PUNK
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.reward}>
                  <span className={styles.rewardIcon}>💰</span>
                  <span className={styles.rewardText}>+{target.bountyReward} $PUNK</span>
                </div>
                
                {filter === 'audit' && (
                  <button
                    onClick={() => handleAudit(target.tokenId)}
                    disabled={actionInProgress === target.tokenId}
                    className={`${styles.actionButton} ${styles.auditButton}`}
                  >
                    {actionInProgress === target.tokenId ? 'AUDITING...' : '🔍 AUDIT'}
                  </button>
                )}
                
                {filter === 'execute' && (
                  <button
                    onClick={() => handleExecute(target.tokenId)}
                    disabled={actionInProgress === target.tokenId}
                    className={`${styles.actionButton} ${styles.executeButton}`}
                  >
                    {actionInProgress === target.tokenId ? 'EXECUTING...' : '⚔️ EXECUTE'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
