'use client';

import { useEffect } from 'react';
import styles from './AdModal.module.css';
import LinkifyText from './LinkifyText';

interface AdItem {
  message: string;
  by: string;
  date: string;
  slot: string;
  duration: string;
  status: string;
}

interface AdModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly ad: AdItem | null;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function AdModal({ isOpen, onClose, ad }: AdModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ad) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const statusColor = ad.status === 'ACTIVE' ? 'var(--accent-green)' : 'var(--text-muted)';

  return (
    <div 
      className={`${styles.adModalOverlay} ${isOpen ? styles.open : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-modal-title"
    >
      <div className={styles.adModal}>
        <div className={styles.adModalHeader}>
          <div className={styles.adModalTag} id="ad-modal-title">📢 Ad Info</div>
          <button 
            className={styles.adModalClose}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.adModalMsg}>
          <LinkifyText text={ad.message} />
        </div>

        <div className={styles.adModalInfo}>
          <div className={styles.adModalRow}>
            <span className={styles.key}>By</span>
            <span className={styles.val}>{ad.by || '—'}</span>
          </div>
          <div className={styles.adModalRow}>
            <span className={styles.key}>Date</span>
            <span className={styles.val}>{formatDate(ad.date)}</span>
          </div>
          <div className={styles.adModalRow}>
            <span className={styles.key}>Duration</span>
            <span className={styles.val}>{ad.duration || '—'}</span>
          </div>
          <div className={styles.adModalRow}>
            <span className={styles.key}>Status</span>
            <span className={styles.val} style={{ color: statusColor }}>
              {ad.status === 'ACTIVE' ? '● LIVE' : ad.status}
            </span>
          </div>
        </div>

        <div className={styles.adModalFooter}>
          CLICK ANYWHERE OUTSIDE TO CLOSE
        </div>
      </div>
    </div>
  );
}
