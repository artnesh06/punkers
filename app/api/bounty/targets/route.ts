import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTaxStatus } from '@/lib/services/tax-calculator';
import { getGameState } from '@/lib/services/game-state-service';
import { GAME_CONFIG, syncConfigFromDB } from '@/lib/services/game-engine';

/**
 * GET /api/bounty/targets?type=audit|execute
 * Get list of NFTs that can be audited or executed
 * 
 * Query params:
 * - type: 'audit' (24h+ overdue) or 'execute' (48h+ overdue)
 */
export async function GET(request: NextRequest) {
  try {
    await syncConfigFromDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'audit' | 'execute' | null;

    if (!type || (type !== 'audit' && type !== 'execute')) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "audit" or "execute"' },
        { status: 400 }
      );
    }

    // Get game state
    const gameState = await getGameState();

    // Get all staked NFTs that are alive
    const allStaked = await prisma.mst_staker.findMany({
      where: {
        isStaked: true,
        isDead: false,
      },
      include: {
        user: true,
        collection: true,
      },
    });

    // Filter and map based on tax status
    const targets = allStaked
      .map((staker) => {
        const taxStatus = calculateTaxStatus(
          staker.lastTaxPayment || staker.stakedAt || new Date(),
          gameState.gameStartDate,
          staker.lastAudit
        );

        return {
          ...staker,
          taxStatus,
        };
      })
      .filter((staker) => {
        if (type === 'audit') {
          // Can audit if AUDITED status (24h+ overdue but less than 48h)
          return staker.taxStatus.status === 'AUDITED';
        } else {
          // Can execute if EXECUTED status (48h+ overdue)
          return staker.taxStatus.status === 'EXECUTED';
        }
      })
      .map((staker) => ({
        tokenId: staker.tokenId,
        owner: staker.user.address,
        ownerShort: `${staker.user.address.slice(0, 6)}...${staker.user.address.slice(-4)}`,
        hoursOverdue: staker.taxStatus.hoursOverdue,
        taxDue: staker.taxStatus.taxDue,
        penalty: staker.taxStatus.penalty,
        totalDue: staker.taxStatus.totalDue,
        status: staker.taxStatus.status,
        lastTaxPayment: staker.lastTaxPayment,
        collection: {
          name: staker.collection.name,
          contractAddress: staker.collection.contractAddress,
        },
        bountyReward: GAME_CONFIG.bountyReward,
      }))
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue); // Sort by most overdue first

    return NextResponse.json({
      success: true,
      type,
      targets,
      count: targets.length,
      message: targets.length === 0 
        ? `No targets available for ${type}`
        : `Found ${targets.length} target(s) for ${type}`,
    });
  } catch (error) {
    console.error('Error fetching bounty targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
