import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import { prisma } from '@/lib/prisma';
import { getGameDay, getCurrentTax } from '@/lib/services/game-engine';
import {
  createGameSession,
  startGameSession,
  endGameSession,
  getActiveGameSession,
  GameSessionError,
} from '@/lib/services/game-session-service';
import { createWinnerSnapshot } from '@/lib/services/winner-snapshot-service';

/**
 * GET /api/admin/panel — Dashboard data (cookie auth)
 */
export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totalUsers, totalStaked, totalDead, totalAlive,
      activeGame, recentGames,
    ] = await Promise.all([
      prisma.mst_users.count(),
      prisma.mst_staker.count({ where: { isStaked: true } }),
      prisma.mst_staker.count({ where: { isDead: true } }),
      prisma.mst_staker.count({ where: { isStaked: true, isDead: false } }),
      getActiveGameSession(),
      prisma.mst_game.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    // Treasury balance — only accumulates from taxes, penalties, forfeited earnings.
    // Bounties are minted separately and do NOT reduce the treasury.
    const taxSum = await prisma.trn_point.aggregate({
      where: { type: 'TAX_PAYMENT' },
      _sum: { points: true },
    });
    const penaltySum = await prisma.trn_point.aggregate({
      where: { type: { in: ['AUDIT_PENALTY', 'EXECUTION_FORFEIT'] } },
      _sum: { points: true },
    });
    const treasury = Math.abs(taxSum._sum.points || 0) + Math.abs(penaltySum._sum.points || 0);

    // Top 10 players
    const topPlayers = await prisma.mst_users.findMany({
      orderBy: { points: 'desc' },
      take: 10,
      select: { address: true, points: true, _count: { select: { stakers: true } } },
    });

    return NextResponse.json({
      stats: { totalUsers, totalStaked, totalDead, totalAlive, treasury },
      activeGame,
      recentGames,
      topPlayers: topPlayers.map((u, i) => ({
        rank: i + 1,
        address: u.address,
        points: u.points,
        nfts: u._count.stakers,
      })),
    });
  } catch (error) {
    console.error('Admin panel GET error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
