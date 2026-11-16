import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import { prisma } from '@/lib/prisma';
import { GAME, RARITY } from '@/lib/constants/game';
import { TAX_SCHEDULE, EARNING_SCHEDULE } from '@/lib/services/game-engine';
import { invalidateConfigCache } from '@/lib/services/config-service';

const DEFAULT_CONFIG = {
  totalNFTs: GAME.totalNFTs,
  survivorTarget: GAME.survivorTarget,
  gameDurationDays: GAME.gameDurationDays,
  auditGracePeriodHours: GAME.auditGracePeriodHours,
  executionGracePeriodHours: GAME.executionGracePeriodHours,
  auditPenaltyPercent: GAME.auditPenaltyPercent,
  bountyReward: GAME.bountyReward,
  taxSchedule: TAX_SCHEDULE,
  earnSchedule: EARNING_SCHEDULE,
  rarity: {
    common: RARITY.common.multiplier,
    epic: RARITY.epic.multiplier,
    legendary: RARITY.legendary.multiplier,
    art: RARITY.art.multiplier,
  },
};

/**
 * GET /api/admin/panel/config — Get current config
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const row = await prisma.game_config.findUnique({ where: { id: 'default' } });
    const config = row ? { ...DEFAULT_CONFIG, ...(row.config as object) } : DEFAULT_CONFIG;
    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ success: true, config: DEFAULT_CONFIG });
  }
}

/**
 * PUT /api/admin/panel/config — Update config
 */
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate critical config values
    if (typeof body.auditGracePeriodHours === 'number' && body.auditGracePeriodHours < 1) {
      return NextResponse.json({ error: 'auditGracePeriodHours must be at least 1' }, { status: 400 });
    }
    if (typeof body.executionGracePeriodHours === 'number' && typeof body.auditGracePeriodHours === 'number') {
      if (body.executionGracePeriodHours <= body.auditGracePeriodHours) {
        return NextResponse.json({ error: 'executionGracePeriodHours must be greater than auditGracePeriodHours' }, { status: 400 });
      }
    }
    if (typeof body.auditPenaltyPercent === 'number' && (body.auditPenaltyPercent < 0 || body.auditPenaltyPercent > 100)) {
      return NextResponse.json({ error: 'auditPenaltyPercent must be between 0 and 100' }, { status: 400 });
    }

    await prisma.game_config.upsert({
      where: { id: 'default' },
      update: { config: body },
      create: { id: 'default', config: body },
    });

    // Invalidate in-memory cache so next request picks up new values
    invalidateConfigCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Config update error:', error);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
