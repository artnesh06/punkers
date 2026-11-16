/**
 * Truncate an Ethereum address to the format 0xAAAA...BBBB
 * (first 6 characters + last 4 characters).
 *
 * Edge cases:
 * - null/undefined/empty address returns "0x0000...0000"
 * - Short addresses (≤10 chars) are returned as-is
 */
export function truncateAddress(address: string): string {
  if (!address) {
    return '0x0000...0000';
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a date as relative time from now.
 *
 * Rules:
 * - < 60 seconds → "Xs ago"
 * - 1–59 minutes → "Xm ago"
 * - 1–23 hours → "Xh ago"
 * - ≥ 1 day → "Xd ago"
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Map a game transaction type to its emoji icon.
 *
 * Returns a default icon (📋) for unknown types.
 */
export function getTransactionIcon(type: string): string {
  const iconMap: Record<string, string> = {
    EARNING_CLAIM: '💎',
    TAX_PAYMENT: '💸',
    SLOT_BET: '🎰',
    SLOT_WIN: '🎰',
    LOOT_OPEN: '📦',
    LOOT_WIN: '📦',
    EXECUTION_BOUNTY: '💀',
    AUDIT_BOUNTY: '🎯',
    penalty: '💀',
    AUDIT_PENALTY: '⚠️',
    EXECUTION_FORFEIT: '⚔️',
    AD_PURCHASE: '📢',
  };

  return iconMap[type] ?? '📋';
}

/**
 * Map a game transaction type to its CSS color variable.
 *
 * Returns a default color (var(--text-secondary)) for unknown types.
 */
export function getTransactionColor(type: string): string {
  const colorMap: Record<string, string> = {
    EARNING_CLAIM: 'var(--accent-green)',
    TAX_PAYMENT: 'var(--accent-red)',
    SLOT_BET: 'var(--accent-red)',
    SLOT_WIN: 'var(--accent-yellow)',
    LOOT_OPEN: 'var(--text-secondary)',
    LOOT_WIN: 'var(--accent-purple)',
    EXECUTION_BOUNTY: 'var(--accent-green)',
    AUDIT_BOUNTY: 'var(--accent-green)',
    penalty: 'var(--accent-red)',
    AUDIT_PENALTY: 'var(--accent-red)',
    EXECUTION_FORFEIT: 'var(--accent-red)',
    AD_PURCHASE: 'var(--accent-red)',
  };

  return colorMap[type] ?? 'var(--text-secondary)';
}

/**
 * Map a game transaction type to a human-readable label.
 *
 * Returns "unknown transaction" for unrecognized types.
 */
export function getTransactionLabel(type: string): string {
  const labelMap: Record<string, string> = {
    EARNING_CLAIM: 'claimed earnings',
    TAX_PAYMENT: 'paid tax',
    SLOT_BET: 'bet on Slot Machine',
    SLOT_WIN: 'won on Slot Machine',
    LOOT_OPEN: 'opened Loot Chest',
    LOOT_WIN: 'won Loot prize',
    EXECUTION_BOUNTY: 'earned execution bounty',
    AUDIT_BOUNTY: 'earned audit bounty',
    penalty: 'received death penalty',
    AUDIT_PENALTY: 'received audit penalty',
    EXECUTION_FORFEIT: 'forfeited earnings',
    AD_PURCHASE: 'purchased an ad',
  };

  return labelMap[type] ?? 'unknown transaction';
}

/**
 * Build a display description for a transaction.
 *
 * If the transaction has a non-empty description, return it as-is.
 * Otherwise, generate a fallback: "{truncatedAddress} {typeLabel}".
 */
export function buildDescription(
  tx: { description: string | null; type: string },
  truncatedAddress: string
): string {
  if (tx.description) {
    return tx.description;
  }

  return `${truncatedAddress} ${getTransactionLabel(tx.type)}`;
}
