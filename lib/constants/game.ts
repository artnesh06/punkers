/**
 * Shared game constants — used by both frontend pages and backend services.
 * Single source of truth for all game-related numbers.
 * 
 * If you need to change any game parameter, change it HERE.
 * All pages, components, and services import from this file.
 */

export const GAME = {
  totalNFTs: 5000,
  survivorTarget: 500,
  gameDurationDays: 60,
  auditGracePeriodHours: 24,
  executionGracePeriodHours: 48,
  auditPenaltyPercent: 20,
  bountyReward: 10,
} as const;

export const RARITY = {
  common: { label: 'COMMON', multiplier: 1.0, color: '#888' },
  epic: { label: 'EPIC', multiplier: 1.1, color: '#b44dff' },
  legendary: { label: 'LEGENDARY', multiplier: 1.21, color: '#ffcc00' },
  art: { label: '1/1 ART', multiplier: 1.33, color: '#ff2d95' },
} as const;
