import { GAME, RARITY } from '@/lib/constants/game';

/**
 * Punkers Game Engine
 * Implements the core game mechanics based on the official rules.
 *
 * Config values are mutable — call syncConfigFromDB() at the start of
 * each API request to pick up admin-panel changes from the database.
 */

export interface GameConfig {
  totalNFTs: number;
  survivorTarget: number;
  gameDurationDays: number;
  auditGracePeriodHours: number;
  executionGracePeriodHours: number;
  auditPenaltyPercent: number;
  bountyReward: number;
}

export interface RarityMultiplier {
  common: number;
  epic: number;
  legendary: number;
  art: number;
}

export interface TaxSchedule {
  period: string;
  startDay: number;
  endDay: number;
  taxPerDay: number;
}

export interface EarningSchedule {
  period: string;
  startDay: number;
  endDay: number;
  baseEarnPerDay: number;
}

export const GAME_CONFIG: GameConfig = { ...GAME };

export const RARITY_MULTIPLIERS: RarityMultiplier = {
  common: RARITY.common.multiplier,
  epic: RARITY.epic.multiplier,
  legendary: RARITY.legendary.multiplier,
  art: RARITY.art.multiplier,
};

export const TAX_SCHEDULE: TaxSchedule[] = [
  { period: 'Day 1–3', startDay: 1, endDay: 3, taxPerDay: 3 },
  { period: 'Day 4–7', startDay: 4, endDay: 7, taxPerDay: 6 },
  { period: 'Day 8–14', startDay: 8, endDay: 14, taxPerDay: 12 },
  { period: 'Day 15–21', startDay: 15, endDay: 21, taxPerDay: 22 },
  { period: 'Day 22–30', startDay: 22, endDay: 30, taxPerDay: 35 },
  { period: 'Day 31–40', startDay: 31, endDay: 40, taxPerDay: 48 },
  { period: 'Day 41–50', startDay: 41, endDay: 50, taxPerDay: 63 },
  { period: 'Day 51–60', startDay: 51, endDay: 60, taxPerDay: 80 },
];

export const EARNING_SCHEDULE: EarningSchedule[] = [
  { period: 'Day 1–3', startDay: 1, endDay: 3, baseEarnPerDay: 10 },
  { period: 'Day 4–7', startDay: 4, endDay: 7, baseEarnPerDay: 15 },
  { period: 'Day 8–14', startDay: 8, endDay: 14, baseEarnPerDay: 20 },
  { period: 'Day 15–21', startDay: 15, endDay: 21, baseEarnPerDay: 30 },
  { period: 'Day 22–30', startDay: 22, endDay: 30, baseEarnPerDay: 40 },
  { period: 'Day 31–40', startDay: 31, endDay: 40, baseEarnPerDay: 50 },
  { period: 'Day 41–50', startDay: 41, endDay: 50, baseEarnPerDay: 65 },
  { period: 'Day 51–60', startDay: 51, endDay: 60, baseEarnPerDay: 80 },
];

export type NFTRarity = 'common' | 'epic' | 'legendary' | 'art';
export type NFTStatus = 'alive' | 'audited' | 'executed';

/**
 * Calculate current tax based on global game day
 */
export function getCurrentTax(globalGameDay: number): number {
  const schedule = TAX_SCHEDULE.find(
    (s) => globalGameDay >= s.startDay && globalGameDay <= s.endDay
  );
  return schedule?.taxPerDay || TAX_SCHEDULE[TAX_SCHEDULE.length - 1].taxPerDay;
}

/**
 * Calculate earning based on personal stake day and rarity
 */
export function getCurrentEarning(personalStakeDay: number, rarity: NFTRarity): number {
  const schedule = EARNING_SCHEDULE.find(
    (s) => personalStakeDay >= s.startDay && personalStakeDay <= s.endDay
  );
  const baseEarn = schedule?.baseEarnPerDay || EARNING_SCHEDULE[EARNING_SCHEDULE.length - 1].baseEarnPerDay;
  const multiplier = RARITY_MULTIPLIERS[rarity];
  return Math.floor(baseEarn * multiplier);
}

/**
 * Calculate net profit/loss for a given day
 */
export function calculateNetProfit(
  personalStakeDay: number,
  globalGameDay: number,
  rarity: NFTRarity
): number {
  const earning = getCurrentEarning(personalStakeDay, rarity);
  const tax = getCurrentTax(globalGameDay);
  return earning - tax;
}

/**
 * Get NFT status based on last tax payment
 */
export function getNFTStatus(lastTaxPayment: Date | null, currentTime: Date = new Date()): {
  status: NFTStatus;
  hoursOverdue: number;
  canBeAudited: boolean;
  canBeExecuted: boolean;
} {
  if (!lastTaxPayment) {
    return {
      status: 'alive',
      hoursOverdue: 0,
      canBeAudited: false,
      canBeExecuted: false,
    };
  }

  const hoursOverdue = (currentTime.getTime() - lastTaxPayment.getTime()) / (1000 * 60 * 60);
  
  if (hoursOverdue >= GAME_CONFIG.executionGracePeriodHours) {
    return {
      status: 'executed',
      hoursOverdue,
      canBeAudited: false,
      canBeExecuted: true,
    };
  } else if (hoursOverdue >= GAME_CONFIG.auditGracePeriodHours) {
    return {
      status: 'audited',
      hoursOverdue,
      canBeAudited: true,
      canBeExecuted: false,
    };
  }

  return {
    status: 'alive',
    hoursOverdue,
    canBeAudited: false,
    canBeExecuted: false,
  };
}

/**
 * Calculate total tax owed including penalties
 */
export function calculateTaxOwed(
  globalGameDay: number,
  status: NFTStatus,
  daysOverdue: number = 1,
  wasAudited: boolean = false
): number {
  const baseTax = getCurrentTax(globalGameDay) * daysOverdue;
  
  // Penalty only applies if NFT was actually audited by another player
  if (status === 'audited' && wasAudited) {
    const penalty = baseTax * (GAME_CONFIG.auditPenaltyPercent / 100);
    return baseTax + penalty;
  }
  
  return baseTax;
}

/**
 * Get game day from start date
 */
export function getGameDay(gameStartDate: Date, currentDate: Date = new Date()): number {
  const diffTime = currentDate.getTime() - gameStartDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Get personal stake day
 */
export function getPersonalStakeDay(stakeDate: Date, currentDate: Date = new Date()): number {
  const diffTime = currentDate.getTime() - stakeDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Calculate projected 60-day earnings for a rarity
 */
export function calculateProjectedEarnings(rarity: NFTRarity): {
  totalEarned: number;
  totalTaxPaid: number;
  netProfit: number;
} {
  let totalEarned = 0;
  let totalTaxPaid = 0;

  for (let day = 1; day <= GAME_CONFIG.gameDurationDays; day++) {
    const earning = getCurrentEarning(day, rarity);
    const tax = getCurrentTax(day);
    
    totalEarned += earning;
    totalTaxPaid += tax;
  }

  return {
    totalEarned,
    totalTaxPaid,
    netProfit: totalEarned - totalTaxPaid,
  };
}

/**
 * Determine NFT rarity from on-chain traits (OpenSea metadata).
 *
 * The collection has a `Rarity` trait with values:
 *   "Common", "Epic", "Legendary", "1/1"
 *
 * We normalise these to the internal NFTRarity type used by the game engine:
 *   common | epic | legendary | art
 *
 * @param tokenId   - Token identifier (unused now, kept for backward compat)
 * @param traits    - Optional array of { trait_type, value } from OpenSea metadata.
 *                    When omitted the function falls back to 'common'.
 */
export function determineNFTRarity(
  tokenId: string,
  traits?: Array<{ trait_type: string; value: string | number }>
): NFTRarity {
  if (!traits || traits.length === 0) return 'common';

  const rarityTrait = traits.find(
    (t) => t.trait_type.toLowerCase() === 'rarity'
  );

  if (!rarityTrait) return 'common';

  const value = String(rarityTrait.value).toLowerCase().trim();

  if (value === '1/1') return 'art';
  if (value === 'legendary') return 'legendary';
  if (value === 'epic') return 'epic';
  return 'common';
}

/**
 * Calculate current game day from game start date
 * @param gameStartDate - Optional start date. If not provided, uses GAME_START_DATE env var or defaults to today (day 1).
 *                         For accurate results, always pass the gameStartDate from the database gameState record.
 */
export function getCurrentGameDay(gameStartDate?: Date): number {
  if (gameStartDate) {
    return getGameDay(gameStartDate);
  }
  
  // Fallback: use environment variable or default to today (day 1)
  const envDate = process.env.GAME_START_DATE;
  const startDate = envDate ? new Date(envDate) : new Date();
  return getGameDay(startDate);
}

/**
 * Calculate daily earning for a staked NFT
 */
export function calculateDailyEarning(
  personalStakeDay: number,
  rarity: NFTRarity
): number {
  return getCurrentEarning(personalStakeDay, rarity);
}

/**
 * Calculate daily tax for current global day
 */
export function calculateDailyTax(globalGameDay: number): number {
  return getCurrentTax(globalGameDay);
}

/**
 * Determine if late joiner can survive
 */
export function canLateJoinerSurvive(
  globalGameDay: number,
  rarity: NFTRarity,
  punkBalance: number = 0
): {
  canSurvive: boolean;
  daysUntilBreakEven: number;
  immediateDeficit: number;
} {
  const currentTax = getCurrentTax(globalGameDay);
  const currentEarning = getCurrentEarning(1, rarity); // Day 1 earning for new staker
  const immediateDeficit = currentTax - currentEarning;
  
  // Calculate days until break even
  let daysUntilBreakEven = 0;
  let cumulativeDeficit = immediateDeficit;
  
  for (let personalDay = 2; personalDay <= GAME_CONFIG.gameDurationDays; personalDay++) {
    const earning = getCurrentEarning(personalDay, rarity);
    const tax = getCurrentTax(globalGameDay + personalDay - 1);
    const dailyNet = earning - tax;
    
    cumulativeDeficit += dailyNet;
    
    if (cumulativeDeficit <= 0) {
      daysUntilBreakEven = personalDay;
      break;
    }
  }
  
  const canSurvive = punkBalance >= Math.abs(immediateDeficit) && daysUntilBreakEven > 0;
  
  return {
    canSurvive,
    daysUntilBreakEven,
    immediateDeficit,
  };
}

/**
 * Sync game engine config from database.
 * Call this at the start of API route handlers to pick up admin changes.
 * Safe to call multiple times — uses cached config (60s TTL).
 */
export async function syncConfigFromDB(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency
    const { getGameConfig } = await import('./config-service');
    const cfg = await getGameConfig();

    // Mutate module-level config objects so all sync functions use updated values
    GAME_CONFIG.survivorTarget = cfg.survivorTarget;
    GAME_CONFIG.gameDurationDays = cfg.gameDurationDays;
    GAME_CONFIG.auditGracePeriodHours = cfg.auditGracePeriodHours;
    GAME_CONFIG.executionGracePeriodHours = cfg.executionGracePeriodHours;
    GAME_CONFIG.auditPenaltyPercent = cfg.auditPenaltyPercent;
    GAME_CONFIG.bountyReward = cfg.bountyReward;

    RARITY_MULTIPLIERS.common = cfg.rarity.common;
    RARITY_MULTIPLIERS.epic = cfg.rarity.epic;
    RARITY_MULTIPLIERS.legendary = cfg.rarity.legendary;
    RARITY_MULTIPLIERS.art = cfg.rarity.art;

    // Update schedules in-place
    if (cfg.taxSchedule?.length > 0) {
      TAX_SCHEDULE.length = 0;
      cfg.taxSchedule.forEach((s: any) => TAX_SCHEDULE.push(s));
    }
    if (cfg.earnSchedule?.length > 0) {
      EARNING_SCHEDULE.length = 0;
      cfg.earnSchedule.forEach((s: any) => EARNING_SCHEDULE.push(s));
    }
  } catch (err) {
    // Fail-open: if DB is down, keep using current in-memory values
    console.warn('syncConfigFromDB failed (using defaults):', err);
  }
}
