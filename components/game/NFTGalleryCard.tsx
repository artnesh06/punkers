'use client';

import styles from './NFTCard.module.css';

interface NFTGalleryCardProps {
  nft: any;
  onClick: () => void;
  position?: 'center' | 'left' | 'right';
}

export default function NFTGalleryCard({ nft, onClick, position = 'center' }: NFTGalleryCardProps) {
  const positionClass = position === 'center' ? styles.pc : position === 'left' ? styles.pl : styles.pr;
  const pinLeft = position === 'center' ? '50%' : position === 'left' ? '15%' : '85%';

  return (
    <div className={`${styles.hanging} ${positionClass}`}>
      <div className={styles.pin} style={{ left: pinLeft }} />
      <div className={styles.win98}>
        <div className={styles.win98Title}>
          <span style={{ fontSize: '13px' }}>
            {nft.metadata?.name || `Punker #${nft.tokenId}`}.bmp
          </span>
        </div>
        <div
          style={{
            padding: '14px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={onClick}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              border: '2px solid var(--border)',
              overflow: 'hidden',
              marginBottom: '10px',
              background: '#1a1a1a',
            }}
          >
            <img
              src={nft.metadata?.image || '/placeholder-nft.png'}
              alt={nft.metadata?.name || `Punker #${nft.tokenId}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '13px',
              color: 'var(--dim)',
            }}
          >
            #{nft.tokenId}
          </div>
        </div>
      </div>
    </div>
  );
}
