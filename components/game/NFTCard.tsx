import { useState, useEffect } from 'react';
import { NFTAttribute } from '@/types/nft';
import type { LayoutOption } from '@/components/features/LayoutSwitcher';
import { calculateTaxStatus, formatTimeRemaining } from '@/lib/services/tax-calculator';
import styles from './NFTCard.module.css';

interface NFTCardProps {
  // Basic info
  tokenId: string;
  name?: string;
  imageUrl?: string;
  emoji?: string;

  // Status
  status?: 'alive' | 'dead' | 'staked' | 'audited' | 'rip';
  isStaked?: boolean;
  isDead?: boolean;

  // Stats
  health?: number;
  estimatedPoints?: number;
  attributes?: NFTAttribute[];
  stakedDate?: string;

  // Tax/Survival info (for inline display)
  lastTaxPayment?: Date | null;
  gameStartDate?: Date | null;

  // Variant
  variant?: 'default' | 'stake' | 'gallery';
  layout?: LayoutOption;

  // Actions
  onClick?: () => void;
  onStake?: () => void;
  onPayTax?: () => void;
  onClaim?: () => void;
  isClaimLoading?: boolean;
  isPayTaxLoading?: boolean;

  // Additional props
  className?: string;
  label?: string;
}

/**
 * Inner component for stake cards that handles the live countdown timer
 */
function NFTCardWithTimer({
  cardClasses,
  displayStatus,
  onClick,
  emoji,
  imageUrl,
  name,
  tokenId,
  stakedDate,
  isRip,
  isAuditedDisplay,
  isStaked,
  estimatedPoints,
  taxStatus,
  lastTaxPayment,
  onPayTax,
  isPayTaxLoading,
  onStake,
}: {
  cardClasses: string;
  displayStatus: string;
  onClick?: () => void;
  emoji?: string;
  imageUrl?: string;
  name?: string;
  tokenId: string;
  stakedDate?: string;
  isRip: boolean;
  isAuditedDisplay: boolean;
  isStaked: boolean;
  estimatedPoints?: number;
  taxStatus: ReturnType<typeof calculateTaxStatus> | null;
  lastTaxPayment: Date | null;
  onPayTax?: () => void;
  isPayTaxLoading?: boolean;
  onStake?: () => void;
}) {
  const [timeDisplay, setTimeDisplay] = useState('');

  useEffect(() => {
    if (!lastTaxPayment || !isStaked || isRip) return;
    const update = () => setTimeDisplay(formatTimeRemaining(lastTaxPayment));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lastTaxPayment, isStaked, isRip]);

  // Build the action button text
  const getActionButton = () => {
    if (isRip) {
      return (
        <button className={`${styles.nftActionBtn} ${styles.ripBtn}`}>
          🪦 Execution on Day 42
        </button>
      );
    }

    if (isAuditedDisplay && taxStatus && onPayTax) {
      return (
        <button
          className={`${styles.nftActionBtn} ${styles.payBtn}`}
          disabled={isPayTaxLoading}
          onClick={(e) => {
            e.stopPropagation();
            onPayTax();
          }}
        >
          {isPayTaxLoading
            ? '⏳ Paying...'
            : `Pay Tax for ${taxStatus.taxDue} $PUNK + ${taxStatus.penalty > 0 ? '20%' : '0%'}`}
        </button>
      );
    }

    if (isStaked && lastTaxPayment) {
      return (
        <button className={`${styles.nftActionBtn} ${styles.nextPayBtn}`} onClick={(e) => e.stopPropagation()}>
          Next Pay in {timeDisplay}
        </button>
      );
    }

    // NFT is staked (participant) but no lastTaxPayment yet = newly detected NFT
    if (isStaked && !lastTaxPayment && onPayTax) {
      return (
        <button
          className={`${styles.nftActionBtn} ${styles.payBtn}`}
          disabled={isPayTaxLoading}
          onClick={(e) => {
            e.stopPropagation();
            onPayTax();
          }}
        >
          {isPayTaxLoading ? '⏳ Registering...' : '🆕 Pay First Tax'}
        </button>
      );
    }

    if (!isStaked && onStake) {
      // Pre-participant: no individual stake button
      // User should click "ENTER GAME" on the stake page instead
      return null;
    }

    return null;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('Card clicked', { tokenId, target: e.target });
    // Only trigger onClick if not clicking a button
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      console.log('Button clicked, ignoring card click');
      return;
    }
    console.log('Opening modal for', tokenId);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={cardClasses} 
      data-status={displayStatus} 
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.nftStakeTop}>
        <div className={styles.nftStakeAvatar}>
          {emoji || imageUrl
            ? emoji || <img src={imageUrl} alt={name || `NFT #${tokenId}`} />
            : '❓'}
        </div>
        <div className={styles.nftStakeInfo}>
          <div className={styles.nftStakeName}>
            {name || `NFT #${tokenId}`}
          </div>
          <div className={styles.nftStakedDate}>
            Staked: <span>{stakedDate || '—'}</span>
          </div>
          <div className={styles.nftStakeStatus}>
            Status:{' '}
            <span className={`${styles.statusBadge} ${styles[displayStatus]}`}>
              {isRip && '🪦 RIP'}
              {isAuditedDisplay && '⚠️ UNPAID'}
              {displayStatus === 'staked' && !isAuditedDisplay && '⚡ SURVIVAL'}
              {displayStatus === 'unstaked' && '🆕 NEW'}
            </span>
          </div>
          {estimatedPoints !== undefined && (
            <div className={styles.nftStakePoints}>
              Est. Points/Day: <span>{estimatedPoints}</span>
            </div>
          )}
        </div>
      </div>

      {getActionButton()}
    </div>
  );
}

export default function NFTCard({
  tokenId,
  name,
  imageUrl,
  emoji,
  status,
  isStaked = false,
  isDead = false,
  health,
  estimatedPoints,
  attributes = [],
  stakedDate,
  lastTaxPayment = null,
  gameStartDate = null,
  variant = 'default',
  layout = 'grid3',
  onClick,
  onStake,
  onPayTax,
  onClaim,
  isClaimLoading = false,
  isPayTaxLoading = false,
  className = '',
  label,
}: Readonly<NFTCardProps>) {
  // Determine actual status
  const actualStatus =
    status || (isDead ? 'dead' : isStaked ? 'staked' : 'alive');
  const isAudited = actualStatus === 'audited';
  const isRip = actualStatus === 'rip' || isDead;

  // Gallery variant (home page NFT cards)
  if (variant === 'gallery') {
    return (
      <div className={`${styles.nftCard} ${className}`} onClick={onClick}>
        {imageUrl ? (
          <img src={imageUrl} alt={name || `NFT #${tokenId}`} className={styles.nftImage} />
        ) : (
          <div className={styles.nftEmoji}>{emoji || '❓'}</div>
        )}
        {label && <div className={styles.nftLabel}>{label}</div>}
      </div>
    );
  }

  // Stake variant (stake page cards)
  if (variant === 'stake') {
    const layoutClassMap: Record<LayoutOption, string | undefined> = {
      grid3: styles.layoutGrid3,
      grid2: styles.layoutGrid2,
      grid4: styles.layoutGrid4,
      list: styles.layoutList,
      'list-detail': styles.layoutListDetail,
    };

    // Calculate tax status inline
    const taxStatus = isStaked && lastTaxPayment && gameStartDate
      ? calculateTaxStatus(lastTaxPayment, gameStartDate)
      : null;

    // Determine display status from tax status
    // AUDITED (24-48h overdue) or EXECUTED (48h+) both show as unpaid/audited
    const isOverdue = taxStatus?.status === 'AUDITED' || taxStatus?.status === 'EXECUTED';
    const displayStatus = isRip ? 'rip' : isOverdue ? 'audited' : isStaked ? 'staked' : 'unstaked';
    const isAuditedDisplay = displayStatus === 'audited';

    const cardClasses = [
      styles.nftStakeCard,
      layoutClassMap[layout],
      isAuditedDisplay && styles.audited,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <NFTCardWithTimer
        cardClasses={cardClasses}
        displayStatus={displayStatus}
        onClick={onClick}
        emoji={emoji}
        imageUrl={imageUrl}
        name={name}
        tokenId={tokenId}
        stakedDate={stakedDate}
        isRip={isRip}
        isAuditedDisplay={isAuditedDisplay}
        isStaked={isStaked}
        estimatedPoints={estimatedPoints}
        taxStatus={taxStatus}
        lastTaxPayment={lastTaxPayment}
        onPayTax={onPayTax}
        isPayTaxLoading={isPayTaxLoading}
        onStake={onStake}
      />
    );
  }

  // Default variant (original card style)
  const cardClass = `${styles.card} ${isDead ? styles.dead : ''} ${className}`;

  return (
    <div className={cardClass} onClick={onClick}>
      {isStaked && <span className={styles.shield}>🛡️</span>}

      {imageUrl ? (
        <img src={imageUrl} alt={`NFT #${tokenId}`} className={styles.avatar} />
      ) : emoji ? (
        <div className={styles.avatar}>{emoji}</div>
      ) : null}

      <div className={styles.content}>
        <div className={styles.tokenId}>{name || `NFT #${tokenId}`}</div>

        <div className={`${styles.status} ${isStaked ? styles.staked : ''}`}>
          {isStaked ? '⚡ IN GAME' : isDead ? '💀 DEAD' : '🆕 NEW'}
        </div>

        {attributes.length > 0 && (
          <div className={styles.attributes}>
            {attributes.slice(0, 3).map((attr) => (
              <span
                key={`${attr.trait_type}-${attr.value}`}
                className={styles.attribute}
              >
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}

        {estimatedPoints !== undefined && (
          <div className={styles.points}>
            Est. Points: {estimatedPoints}/day
          </div>
        )}
      </div>
    </div>
  );
}
