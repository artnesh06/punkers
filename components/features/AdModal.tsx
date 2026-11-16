'use client';

import { useEffect } from 'react';
import styles from './AdModal.module.css';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  details?: {
    by?: string;
    date?: string;
    slot?: string;
    duration?: string;
    status?: string;
  };
}

export default function AdModal({
  isOpen,
  onClose,
  message,
  details = {},
}: AdModalProps) {
  // ESC key handler
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

  // Outside click handler
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          [X]
        </button>

        {/* Modal tag */}
        <div className={styles.tag}>📢 Ad Info</div>

        {/* Message with left border */}
        <div className={styles.message}>{message}</div>

        {/* Info rows with key-value pairs */}
        {details && Object.keys(details).length > 0 && (
          <div className={styles.info}>
            {details.by && (
              <div className={styles.row}>
                <span className={styles.key}>By</span>
                <span className={styles.val}>{details.by}</span>
              </div>
            )}
            {details.date && (
              <div className={styles.row}>
                <span className={styles.key}>Date</span>
                <span className={styles.val}>{details.date}</span>
              </div>
            )}
            {details.slot && (
              <div className={styles.row}>
                <span className={styles.key}>Slot</span>
                <span className={styles.val}>{details.slot}</span>
              </div>
            )}
            {details.duration && (
              <div className={styles.row}>
                <span className={styles.key}>Duration</span>
                <span className={styles.val}>{details.duration}</span>
              </div>
            )}
            {details.status && (
              <div className={styles.row}>
                <span className={styles.key}>Status</span>
                <span
                  className={styles.val}
                  style={{
                    color:
                      details.status === 'LIVE'
                        ? 'var(--accent-green)'
                        : 'var(--text-muted)',
                  }}
                >
                  {details.status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className={styles.hint}>CLICK ANYWHERE OUTSIDE TO CLOSE</div>
      </div>
    </div>
  );
}
