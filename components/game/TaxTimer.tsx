'use client';

import { useEffect, useState } from 'react';
import styles from './TaxTimer.module.css';

interface TaxTimerProps {
  lastTaxPayment: Date | string;
  onExpired?: () => void;
}

export default function TaxTimer({ lastTaxPayment, onExpired }: TaxTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [status, setStatus] = useState<'safe' | 'warning' | 'danger' | 'overdue'>('safe');

  useEffect(() => {
    const timer = setInterval(() => {
      const lastPayment = new Date(lastTaxPayment);
      const nextTax = new Date(lastPayment.getTime() + 24 * 60 * 60 * 1000);
      const now = Date.now();
      const diff = nextTax.getTime() - now;

      if (diff <= 0) {
        // Overdue
        const overdueDiff = Math.abs(diff);
        const hours = Math.floor(overdueDiff / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${hours}h ${minutes}m OVERDUE`);
        setStatus('overdue');
        
        if (onExpired) {
          onExpired();
        }
      } else {
        // Not overdue yet
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        
        // Set status based on time remaining
        if (hours < 2) {
          setStatus('danger');
        } else if (hours < 6) {
          setStatus('warning');
        } else {
          setStatus('safe');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastTaxPayment, onExpired]);

  return (
    <div className={`${styles.timer} ${styles[status]}`}>
      <div className={styles.label}>
        {status === 'overdue' ? '⚠️ TAX OVERDUE' : '⏰ Next Tax Due'}
      </div>
      <div className={styles.time}>{timeLeft}</div>
    </div>
  );
}
