'use client';

import { useState, useEffect } from 'react';
import { calculateTaxStatus, formatTimeRemaining, type TaxStatus } from '@/lib/services/tax-calculator';
import styles from './TaxStatusCard.module.css';

interface TaxStatusCardProps {
  lastTaxPayment: Date;
  gameStartDate: Date;
  tokenId: string;
  onPayTax: () => void;
  userBalance: number;
  isLoading?: boolean;
}

export default function TaxStatusCard({
  lastTaxPayment,
  gameStartDate,
  tokenId,
  onPayTax,
  userBalance,
  isLoading = false,
}: TaxStatusCardProps) {
  const [taxStatus, setTaxStatus] = useState<TaxStatus | null>(null);
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    const updateStatus = () => {
      const status = calculateTaxStatus(lastTaxPayment, gameStartDate);
      setTaxStatus(status);
      setTimeDisplay(formatTimeRemaining(lastTaxPayment));
    };

    updateStatus();
    const timer = setInterval(updateStatus, 1000);
    return () => clearInterval(timer);
  }, [lastTaxPayment, gameStartDate]);

  if (!taxStatus) return null;

  const canAfford = userBalance >= taxStatus.totalDue;
  const statusClass = taxStatus.status.toLowerCase();

  return (
    <div className={`${styles.card} ${styles[statusClass]}`}>
      <div className={styles.header}>
        <div className={styles.statusBadge}>
          <span className={styles.icon}>
            {taxStatus.status === 'PAID' && '✅'}
            {taxStatus.status === 'DUE' && '⏰'}
            {taxStatus.status === 'AUDITED' && '🔍'}
            {taxStatus.status === 'EXECUTED' && '💀'}
          </span>
          <span className={styles.statusText}>{taxStatus.status}</span>
        </div>
        <div className={styles.tokenId}>NFT #{tokenId}</div>
      </div>

      <div className={styles.timer}>
        <div className={styles.timerLabel}>
          {taxStatus.isPaid ? 'Next payment in' : 'Overdue'}
        </div>
        <div className={styles.timerValue}>{timeDisplay}</div>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Base Tax:</span>
          <span className={styles.value}>{taxStatus.taxDue} $PUNK</span>
        </div>
        
        {taxStatus.penalty > 0 && (
          <div className={`${styles.row} ${styles.penalty}`}>
            <span className={styles.label}>Penalty (20%):</span>
            <span className={styles.value}>+{taxStatus.penalty} $PUNK</span>
          </div>
        )}
        
        <div className={`${styles.row} ${styles.total}`}>
          <span className={styles.label}>Total Due:</span>
          <span className={styles.value}>{taxStatus.totalDue} $PUNK</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Your Balance:</span>
          <span className={`${styles.value} ${canAfford ? styles.sufficient : styles.insufficient}`}>
            {userBalance} $PUNK
          </span>
        </div>
      </div>

      {taxStatus.status === 'AUDITED' && (
        <div className={styles.warning}>
          ⚠️ Grace period! Pay within {Math.floor(48 - taxStatus.hoursOverdue)}h or be executed
        </div>
      )}

      {taxStatus.status === 'EXECUTED' && (
        <div className={styles.danger}>
          💀 EXECUTED STATUS - Can be killed by other players!
        </div>
      )}

      {taxStatus.canPay && (
        <button
          onClick={onPayTax}
          disabled={!canAfford || isLoading}
          className={`${styles.payButton} ${taxStatus.status === 'AUDITED' ? styles.urgent : ''}`}
        >
          {isLoading ? (
            'Processing...'
          ) : !canAfford ? (
            `Need ${taxStatus.totalDue - userBalance} more $PUNK`
          ) : taxStatus.status === 'AUDITED' ? (
            `⚠️ PAY NOW + PENALTY (${taxStatus.totalDue} $PUNK)`
          ) : (
            `PAY TAX (${taxStatus.totalDue} $PUNK)`
          )}
        </button>
      )}

      {!canAfford && taxStatus.canPay && (
        <div className={styles.hint}>
          💡 Claim your earnings first to get more $PUNK
        </div>
      )}
    </div>
  );
}
