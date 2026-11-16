'use client';

import { useEffect, useState } from 'react';
import { getCurrentTax, getCurrentEarning, determineNFTRarity, getPersonalStakeDay } from '@/lib/services/game-engine';
import styles from './NFTModal.module.css';

interface NFTModalProps {
  readonly nft: any;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function NFTModal({ nft, isOpen, onClose }: NFTModalProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLightboxOpen, onClose]);

  if (!isOpen || !nft) return null;

  const attributes = nft.metadata?.attributes || [];
  const rarity = nft.rarity || 'Common';

  const getRarityLabel = () => {
    const r = rarity.toLowerCase();
    if (r === 'art' || r === '1/1') return '1/1 ART';
    if (r === 'legendary') return 'Legendary';
    if (r === 'epic') return 'Epic';
    return 'Common';
  };

  const getRarityColor = () => {
    const r = rarity.toLowerCase();
    if (r === 'legendary') return '#ffcc00';
    if (r === 'epic') return '#b44dff';
    if (r === 'art' || r === '1/1') return '#ff2d95';
    return '#e53030';
  };
  const rarityLabel = getRarityLabel();
  const rarityColor = getRarityColor();

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  const handleLightboxClick = () => {
    setIsLightboxOpen(false);
  };

  // Always calculate from traits for accuracy (don't trust DB cache)
  const nftRarity = determineNFTRarity(nft.tokenId, nft.metadata?.attributes);
  const personalDay = nft.stakedAt ? getPersonalStakeDay(new Date(nft.stakedAt)) : 1;
  const estimatedPoints = getCurrentEarning(personalDay, nftRarity);
  const health = nft.health ?? 100;
  const currentGameDay = nft.currentGameDay || 1;
  const taxPerDay = `${getCurrentTax(currentGameDay)} $PUNK/day`;
  const stakedSince = nft.stakedAt
    ? `Day ${Math.max(1, Math.ceil((Date.now() - new Date(nft.stakedAt).getTime()) / (1000 * 60 * 60 * 24)))}`
    : nft.stakedDay || '—';
  const status = nft.isDead ? 'DEAD' : 'ALIVE';

  return (
    <>
      <div
        className={`${styles.overlay} ${styles.open}`}
        onClick={handleOverlayClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Close modal overlay"
      >
        <div className={styles.modalBox} style={{ '--modal-rarity-color': rarityColor } as React.CSSProperties}>
          {/* LEFT: Art Panel */}
          <div className={styles.modalLeft}>
            <div className={styles.artGlow} />
            <div className={styles.avatar} onClick={handleImageClick} role="button" tabIndex={0}>
              {nft.metadata?.image ? (
                <img src={nft.metadata.image} alt={nft.metadata?.name || `Punker #${nft.tokenId}`} />
              ) : (
                <span style={{ fontSize: '130px' }}>🎭</span>
              )}
            </div>
            <div className={styles.artInfo}>
              <div className={styles.modalName}>{nft.metadata?.name || `Punker #${nft.tokenId}`}</div>
              <div className={styles.modalRarity} style={{ color: rarityColor }}>
                ⭐ {rarity.toUpperCase()}
              </div>
              <div className={styles.statusWrap}>
                <span className={`${styles.statusBadge} ${status === 'ALIVE' ? styles.alive : styles.dead}`}>
                  {status === 'ALIVE' ? '✓ ALIVE' : '💀 DEAD'}
                </span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary}>DOWNLOAD</button>
            </div>
          </div>

          {/* RIGHT: Stats Panel */}
          <div className={styles.modalRight}>
            <div className={styles.rightHeader}>
              DETAILS
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <div className={styles.qsLabel}>EST. POINTS/DAY</div>
                <div className={styles.qsValue} style={{ color: '#ffcc00' }}>{estimatedPoints}</div>
              </div>
              <div className={styles.quickStat}>
                <div className={styles.qsLabel}>HEALTH</div>
                <div className={styles.qsValue} style={{ color: health > 50 ? '#00ff66' : health > 20 ? '#ff6600' : '#e53030' }}>{health}%</div>
              </div>
              <div className={styles.quickStat}>
                <div className={styles.qsLabel}>STATUS</div>
                <div className={styles.qsValue} style={{ color: status === 'ALIVE' ? '#00ff66' : '#e53030' }}>{status}</div>
              </div>
            </div>

            {/* Health Bar */}
            <div className={styles.healthWrap}>
              <div className={styles.healthLabel}>
                <span>HEALTH</span>
                <span style={{ color: '#00ff66' }}>{health}%</span>
              </div>
              <div className={styles.healthBar}>
                <div 
                  className={styles.healthFill} 
                  style={{ 
                    width: `${health}%`,
                    background: health > 50 ? '#00ff66' : health > 20 ? '#ff6600' : '#e53030'
                  }}
                />
              </div>
            </div>

            {/* Attribute Rows */}
            <div className={styles.modalRows}>
              <div className={styles.modalRow}>
                <span className={styles.rowKey}>TOKEN ID</span>
                <span className={styles.rowVal}>#{nft.tokenId}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.rowKey}>RARITY</span>
                <span className={styles.rowVal} style={{ color: rarityColor }}>{rarity}</span>
              </div>
              {nft.owner && (
                <div className={styles.modalRow}>
                  <span className={styles.rowKey}>OWNER</span>
                  <span className={styles.rowVal} style={{ fontSize: '12px' }}>
                    {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
                  </span>
                </div>
              )}
              {nft.isStaked !== undefined && (
                <div className={styles.modalRow}>
                  <span className={styles.rowKey}>STAKED</span>
                  <span className={styles.rowVal} style={{ color: nft.isStaked ? '#00ff66' : '#888' }}>
                    {nft.isStaked ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              <div className={styles.modalRow}>
                <span className={styles.rowKey}>TAX/DAY</span>
                <span className={styles.rowVal} style={{ color: '#e53030' }}>{taxPerDay}</span>
              </div>
              <div className={styles.modalRow}>
                <span className={styles.rowKey}>STAKED SINCE</span>
                <span className={styles.rowVal}>{stakedSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className={styles.lightbox}
          onClick={handleLightboxClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLightboxClick(); }}
          aria-label="Close lightbox"
        >
          <img 
            src={nft.metadata?.image} 
            alt={nft.metadata?.name || `Punker #${nft.tokenId}`}
            className={styles.lightboxImage}
          />
        </div>
      )}
    </>
  );
}
