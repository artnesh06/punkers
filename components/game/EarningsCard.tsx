'use client';

import { useState, useEffect } from 'react';
import { calculateCurrentEarnings, type EarningInfo } from '@/lib/services/earning-calculator';
import styles from './EarningsCard.module.css';

interface EarningsCardProps {
  stakedAt: Date;
  tokenId: string;
  lastClaimDate?: Date | null;
  onClaim: () => void;
  isLoading?: boolean;
}

export default function EarningsCard({
  stakedAt,
  tokenId,
  lastClaimDate,
  onClaim,
  isLoading = false,
}: EarningsCardProps) {
  const [earnings, setEarnings] = useState<EarningInfo | null>(null);

  useEffect(() => {
    const updateEarnings = () => {
      const info = calculateCurrentEarnings(stakedAt, tokenId, lastClaimDate);
      setEarnings(info);
    };

    updateEarnings();
    // Update every minute
    const timer = setInterval(updateEarnings, 60000);
    return () => clearInterval(timer);
  }, [stakedAt, tokenId, lastClaimDate]);

  if (!earnings) return null;

  const rarityColors: Record<string, string> = {
    common: '#888888',
    epic: '#b44dff',
    legendary: '#ffcc00',
    art: '#ff2d95',
  };

  const rarityColor = rarityColors[earnings.rarity] || '#888888';

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>💰</span>
          <span>Earnings</span>
        </div>
        <div 
          className={styles.rarity}
          style={{ 
            color: rarityColor,
            borderColor: rarityColor,
            background: `${rarityColor}15`
          }}
        >
          {earnings.rarity === 'art' ? '1/1 ART' : earnings.rarity.toUpperCase()}
        </div>
      </div>

      <div className={styles.mainValue}>
        <div className={styles.amount}>{earnings.totalEarned}</div>
        <div className={styles.currency}>$PUNK</div>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Daily Rate:</span>
          <span className={styles.value}>{earnings.dailyRate} $PUNK/day</span>
        </div>
        
        <div className={styles.row}>
          <span className={styles.label}>Days Staked:</span>
          <span className={styles.value}>{earnings.daysStaked} days</span>
        </div>
        
        <div className={styles.row}>
          <span className={styles.label}>Personal Day:</span>
          <span className={styles.value}>Day {earnings.personalStakeDay}</span>
        </div>
      </div>

      <button
        onClick={onClaim}
        disabled={!earnings.canClaim || isLoading}
        className={styles.claimButton}
      >
        {isLoading ? (
          'Claiming...'
        ) : !earnings.canClaim ? (
          'No Earnings Yet'
        ) : (
          `CLAIM ${earnings.totalEarned} $PUNK`
        )}
      </button>

      {lastClaimDate && (
        <div className={styles.lastClaim}>
          Last claimed: {new Date(lastClaimDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
