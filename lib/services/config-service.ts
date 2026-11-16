/**
 * Config Service
 * Reads game config from database (game_config table) with in-memory cache.
 * Falls back to hardcoded defaults from constants/game.ts if no DB config exists.
 *
 * Cache refreshes every 60 seconds so admin changes take effect within a minute.
 */

import { getPrismaClient } from '@/lib/prisma';
import { GAME, RARITY } from '@/lib/constants/game';
import {
  TAX_SCHEDULE as DEFAULT_TAX,
  EARNING_SCHEDULE as DEFAULT_EARN,
  type TaxSchedule,
  type EarningSchedule,
} from './game-engine';

const prisma = getPrismaClient();

export interface GameConfigData {
  totalNFTs: number;
  survivorTarget: number;
  gameDurationDays: number;
  auditGracePeriodHours: number;
  executionGracePeriodHours: number;
  auditPenaltyPercent: number;
  bountyReward: number;
  taxSchedule: TaxSchedule[];
  earnSchedule: EarningSchedule[];
  rarity: { common: number; epic: number; legendary: number; art: number };
}

const DEFAULTS: GameConfigData = {
  totalNFTs: GAME.totalNFTs,
  survivorTarget: GAME.survivorTarget,
  gameDurationDays: GAME.gameDurationDays,
  auditGracePeriodHours: GAME.auditGracePeriodHours,
  executionGracePeriodHours: GAME.executionGracePeriodHours,
  auditPenaltyPercent: GAME.auditPenaltyPercent,
  bountyReward: GAME.bountyReward,
  taxSchedule: [...DEFAULT_TAX],
  earnSchedule: [...DEFAULT_EARN],
  rarity: {
    common: RARITY.common.multiplier,
    epic: RARITY.epic.multiplier,
    legendary: RARITY.legendary.multiplier,
    art: RARITY.art.multiplier,
  },
};

let cached: GameConfigData | null = null;
let cachedAt = 0;
const CACHE_TTL = 60_000; // 60 seconds

/**
 * Get current game config. Reads from DB with 60s cache.
 * Returns merged config (DB overrides defaults).
 */
export async function getGameConfig(): Promise<GameConfigData> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) {
    return cached;
  }

  try {
    const row = await prisma.game_config.findUnique({ where: { id: 'default' } });
    if (row && row.config) {
      cached = { ...DEFAULTS, ...(row.config as object) } as GameConfigData;
    } else {
      cached = { ...DEFAULTS };
    }
  } catch {
    cached = { ...DEFAULTS };
  }

  cachedAt = now;
  return cached;
}

/** Force cache refresh (call after admin saves config) */
export function invalidateConfigCache() {
  cached = null;
  cachedAt = 0;
}
