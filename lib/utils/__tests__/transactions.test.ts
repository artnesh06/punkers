import { truncateAddress, formatTimeAgo, getTransactionIcon, getTransactionColor, getTransactionLabel, buildDescription } from '../transactions';

describe('truncateAddress', () => {
  it('should truncate a standard Ethereum address to 0xAAAA...BBBB format', () => {
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(
      '0x1234...5678'
    );
  });

  it('should return fallback for null/undefined/empty address', () => {
    expect(truncateAddress(null as unknown as string)).toBe('0x0000...0000');
    expect(truncateAddress(undefined as unknown as string)).toBe('0x0000...0000');
    expect(truncateAddress('')).toBe('0x0000...0000');
  });

  it('should return short addresses as-is (length <= 10)', () => {
    expect(truncateAddress('0x1234')).toBe('0x1234');
    expect(truncateAddress('0x12345678')).toBe('0x12345678');
  });

  it('should handle addresses exactly at the boundary (length 11)', () => {
    expect(truncateAddress('0x123456789')).toBe('0x1234...6789');
  });

  it('should preserve the 0x prefix and correct suffix', () => {
    const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const result = truncateAddress(address);
    expect(result).toBe('0xABCD...EF12');
    expect(result.startsWith(address.slice(0, 6))).toBe(true);
    expect(result.endsWith(address.slice(-4))).toBe(true);
  });
});

describe('formatTimeAgo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return "0s ago" for the current time', () => {
    expect(formatTimeAgo(new Date('2025-01-15T12:00:00Z'))).toBe('0s ago');
  });

  it('should return "Xs ago" for less than 60 seconds', () => {
    expect(formatTimeAgo(new Date('2025-01-15T11:59:31Z'))).toBe('29s ago');
    expect(formatTimeAgo(new Date('2025-01-15T11:59:01Z'))).toBe('59s ago');
  });

  it('should return "Xm ago" for 1-59 minutes', () => {
    expect(formatTimeAgo(new Date('2025-01-15T11:59:00Z'))).toBe('1m ago');
    expect(formatTimeAgo(new Date('2025-01-15T11:30:00Z'))).toBe('30m ago');
    expect(formatTimeAgo(new Date('2025-01-15T11:01:00Z'))).toBe('59m ago');
  });

  it('should return "Xh ago" for 1-23 hours', () => {
    expect(formatTimeAgo(new Date('2025-01-15T11:00:00Z'))).toBe('1h ago');
    expect(formatTimeAgo(new Date('2025-01-15T00:00:00Z'))).toBe('12h ago');
    expect(formatTimeAgo(new Date('2025-01-14T13:00:00Z'))).toBe('23h ago');
  });

  it('should return "Xd ago" for 1 or more days', () => {
    expect(formatTimeAgo(new Date('2025-01-14T12:00:00Z'))).toBe('1d ago');
    expect(formatTimeAgo(new Date('2025-01-08T12:00:00Z'))).toBe('7d ago');
    expect(formatTimeAgo(new Date('2024-12-16T12:00:00Z'))).toBe('30d ago');
  });

  it('should handle boundary at exactly 60 seconds (returns minutes)', () => {
    expect(formatTimeAgo(new Date('2025-01-15T11:59:00Z'))).toBe('1m ago');
  });

  it('should handle boundary at exactly 3600 seconds (returns hours)', () => {
    expect(formatTimeAgo(new Date('2025-01-15T11:00:00Z'))).toBe('1h ago');
  });

  it('should handle boundary at exactly 86400 seconds (returns days)', () => {
    expect(formatTimeAgo(new Date('2025-01-14T12:00:00Z'))).toBe('1d ago');
  });
});

describe('getTransactionIcon', () => {
  it.each([
    ['EARNING_CLAIM', '💎'],
    ['TAX_PAYMENT', '💸'],
    ['SLOT_BET', '🎰'],
    ['SLOT_WIN', '🎰'],
    ['LOOT_OPEN', '📦'],
    ['LOOT_WIN', '📦'],
    ['EXECUTION_BOUNTY', '💀'],
    ['AUDIT_BOUNTY', '🎯'],
    ['penalty', '💀'],
    ['AUDIT_PENALTY', '⚠️'],
    ['EXECUTION_FORFEIT', '⚔️'],
  ])('should return %s icon for %s type', (type, expectedIcon) => {
    expect(getTransactionIcon(type)).toBe(expectedIcon);
  });

  it('should return default icon 📋 for unknown types', () => {
    expect(getTransactionIcon('UNKNOWN_TYPE')).toBe('📋');
    expect(getTransactionIcon('')).toBe('📋');
  });
});

describe('getTransactionColor', () => {
  it.each([
    ['EARNING_CLAIM', 'var(--accent-green)'],
    ['TAX_PAYMENT', 'var(--accent-red)'],
    ['SLOT_BET', 'var(--accent-red)'],
    ['SLOT_WIN', 'var(--accent-yellow)'],
    ['LOOT_OPEN', 'var(--text-secondary)'],
    ['LOOT_WIN', 'var(--accent-purple)'],
    ['EXECUTION_BOUNTY', 'var(--accent-green)'],
    ['AUDIT_BOUNTY', 'var(--accent-green)'],
    ['penalty', 'var(--accent-red)'],
    ['AUDIT_PENALTY', 'var(--accent-red)'],
    ['EXECUTION_FORFEIT', 'var(--accent-red)'],
  ])('should return %s color for %s type', (type, expectedColor) => {
    expect(getTransactionColor(type)).toBe(expectedColor);
  });

  it('should return default color var(--text-secondary) for unknown types', () => {
    expect(getTransactionColor('UNKNOWN_TYPE')).toBe('var(--text-secondary)');
    expect(getTransactionColor('')).toBe('var(--text-secondary)');
  });
});
describe('getTransactionLabel', () => {
  it.each([
    ['EARNING_CLAIM', 'claimed earnings'],
    ['TAX_PAYMENT', 'paid tax'],
    ['SLOT_BET', 'bet on Slot Machine'],
    ['SLOT_WIN', 'won on Slot Machine'],
    ['LOOT_OPEN', 'opened Loot Chest'],
    ['LOOT_WIN', 'won Loot prize'],
    ['EXECUTION_BOUNTY', 'earned execution bounty'],
    ['AUDIT_BOUNTY', 'earned audit bounty'],
    ['penalty', 'received death penalty'],
    ['AUDIT_PENALTY', 'received audit penalty'],
    ['EXECUTION_FORFEIT', 'forfeited earnings'],
  ])('should return "%s" label for %s type', (type, expectedLabel) => {
    expect(getTransactionLabel(type)).toBe(expectedLabel);
  });

  it('should return "unknown transaction" for unknown types', () => {
    expect(getTransactionLabel('UNKNOWN_TYPE')).toBe('unknown transaction');
    expect(getTransactionLabel('')).toBe('unknown transaction');
  });
});

describe('buildDescription', () => {
  it('should return tx.description when it is non-empty', () => {
    const tx = { description: 'Custom description text', type: 'EARNING_CLAIM' };
    expect(buildDescription(tx, '0x1234...5678')).toBe('Custom description text');
  });

  it('should generate fallback when description is null', () => {
    const tx = { description: null, type: 'TAX_PAYMENT' };
    expect(buildDescription(tx, '0xABCD...EF12')).toBe('0xABCD...EF12 paid tax');
  });

  it('should generate fallback when description is empty string', () => {
    const tx = { description: '', type: 'SLOT_BET' };
    expect(buildDescription(tx, '0x1111...2222')).toBe('0x1111...2222 bet on Slot Machine');
  });

  it('should use the correct type label in fallback for each type', () => {
    const tx = { description: null, type: 'LOOT_WIN' };
    expect(buildDescription(tx, '0xAAAA...BBBB')).toBe('0xAAAA...BBBB won Loot prize');
  });

  it('should handle unknown type in fallback', () => {
    const tx = { description: null, type: 'UNKNOWN' };
    expect(buildDescription(tx, '0xAAAA...BBBB')).toBe('0xAAAA...BBBB unknown transaction');
  });
});
