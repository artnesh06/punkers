import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GAME_CONFIG, syncConfigFromDB } from '@/lib/services/game-engine';

/**
 * GET /api/game/targets
 * Get list of NFTs with non-alive statuses for the survival page.
 *
 * 4 statuses in the game flow:
 *   1. ALIVE        — tax paid within 24h (not returned here)
 *   2. UNPAID       — 24h+ overdue, NOT yet audited → other users see "Audit" button
 *   3. AUDITED      — already audited, 24h countdown running → shows "⏱ Pay within XX:XX:XX"
 *   4. EXECUTABLE   — 48h+ overdue OR audit countdown expired → "⚔️ Execute" button
 *
 * Query params:
 * - type: 'unpaid' | 'audited' | 'execute' | 'all' (default: 'all')
 * - limit: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    await syncConfigFromDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const now = new Date();

    const stakedNFTs = await prisma.mst_staker.findMany({
      where: {
        isStaked: true,
        isDead: false,
      },
      include: { user: true },
      take: limit * 3,
    });

    const unpaidTargets: any[] = [];
    const auditedTargets: any[] = [];
    const executeTargets: any[] = [];

    for (const nft of stakedNFTs) {
      // Use lastTaxPayment with fallback to stakedAt (consistent with other endpoints)
      const lastPayment = nft.lastTaxPayment || nft.stakedAt;
      if (!lastPayment) continue;

      const hoursSincePayment = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60);

      // Not overdue yet — ALIVE, skip
      if (hoursSincePayment < GAME_CONFIG.auditGracePeriodHours) continue;

      // 48h+ overdue from last tax payment → EXECUTABLE
      if (hoursSincePayment >= GAME_CONFIG.executionGracePeriodHours) {
        executeTargets.push({
          tokenId: nft.tokenId,
          owner: nft.user.address,
          hoursOverdue: parseFloat(hoursSincePayment.toFixed(1)),
          lastPayment: nft.lastTaxPayment,
          lastAudit: nft.lastAudit,
          status: 'EXECUTABLE',
          bountyReward: GAME_CONFIG.bountyReward,
        });
      }
      // Was audited and still within countdown → AUDITED (waiting for payment)
      else if (nft.lastAudit) {
        const hoursSinceAudit = (now.getTime() - nft.lastAudit.getTime()) / (1000 * 60 * 60);
        const countdownSecondsLeft = Math.max(
          0,
          (GAME_CONFIG.auditGracePeriodHours * 3600) - (hoursSinceAudit * 3600)
        );
        auditedTargets.push({
          tokenId: nft.tokenId,
          owner: nft.user.address,
          hoursOverdue: parseFloat(hoursSincePayment.toFixed(1)),
          lastPayment: nft.lastTaxPayment,
          lastAudit: nft.lastAudit,
          status: 'AUDITED',
          countdownSeconds: Math.floor(countdownSecondsLeft),
          bountyReward: GAME_CONFIG.bountyReward,
        });
      }
      // 24h+ overdue but NOT audited yet → UNPAID (can be audited)
      else {
        unpaidTargets.push({
          tokenId: nft.tokenId,
          owner: nft.user.address,
          hoursOverdue: parseFloat(hoursSincePayment.toFixed(1)),
          lastPayment: nft.lastTaxPayment,
          status: 'UNPAID',
          bountyReward: GAME_CONFIG.bountyReward,
        });
      }
    }

    let targets: any[] = [];
    if (type === 'unpaid') targets = unpaidTargets.slice(0, limit);
    else if (type === 'audited') targets = auditedTargets.slice(0, limit);
    else if (type === 'execute') targets = executeTargets.slice(0, limit);
    else {
      targets = [...executeTargets, ...auditedTargets, ...unpaidTargets]
        .sort((a, b) => b.hoursOverdue - a.hoursOverdue)
        .slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      targets,
      summary: {
        totalUnpaid: unpaidTargets.length,
        totalAudited: auditedTargets.length,
        totalExecutable: executeTargets.length,
        bountyReward: GAME_CONFIG.bountyReward,
      },
    });
  } catch (error) {
    console.error('Error getting game targets:', error);
    return NextResponse.json(
      { error: 'Failed to get game targets' },
      { status: 500 }
    );
  }
}
