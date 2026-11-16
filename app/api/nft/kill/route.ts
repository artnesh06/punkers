import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';
import { getGameState } from '@/lib/services/game-state-service';
import { getNFTStatus, GAME_CONFIG, syncConfigFromDB } from '@/lib/services/game-engine';
import { isGameLocked } from '@/lib/services/game-session-service';

export async function POST(request: NextRequest) {
  try {
    await syncConfigFromDB();

    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const { executorAddress, targetTokenId } = await request.json();

    // Validate input
    if (!executorAddress || !targetTokenId) {
      return NextResponse.json(
        { error: 'Executor address and target token ID are required' },
        { status: 400 }
      );
    }

    if (!validateAddress(executorAddress)) {
      return NextResponse.json(
        { error: 'Invalid executor wallet address' },
        { status: 400 }
      );
    }

    // Find executor user
    const executor = await prisma.mst_users.findUnique({
      where: { address: executorAddress.toLowerCase() },
    });

    if (!executor) {
      return NextResponse.json(
        { error: 'Executor not found. Please connect wallet first.' },
        { status: 404 }
      );
    }

    // Find target NFT
    const targetNFT = await prisma.mst_staker.findFirst({
      where: {
        tokenId: targetTokenId,
        isStaked: true,
        isDead: false,
      },
      include: {
        user: true,
      },
    });

    if (!targetNFT) {
      return NextResponse.json(
        { error: 'Target NFT not found or already dead' },
        { status: 404 }
      );
    }

    // Check if NFT is eligible for execution
    // Use lastTaxPayment with fallback to stakedAt (consistent with staking-service)
    const effectiveLastPayment = targetNFT.lastTaxPayment || targetNFT.stakedAt;
    const nftStatus = getNFTStatus(effectiveLastPayment);
    
    if (!nftStatus.canBeExecuted) {
      return NextResponse.json(
        { error: 'Target NFT is not eligible for execution yet (must be overdue 48+ hours)' },
        { status: 400 }
      );
    }

    // Prevent self-execution (can't execute your own NFT for bounty)
    if (targetNFT.userId === executor.id) {
      return NextResponse.json(
        { error: 'You cannot execute your own NFT' },
        { status: 400 }
      );
    }

    const gameState = await getGameState();

    // Perform execution in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Kill the NFT permanently
      const executedNFT = await tx.mst_staker.update({
        where: { id: targetNFT.id },
        data: {
          isDead: true,
          isStaked: false,
          deathDate: new Date(),
          causeOfDeath: 'EXECUTED_FOR_TAX_EVASION',
          unstakedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Reward executor
      await tx.trn_point.create({
        data: {
          userId: executor.id,
          points: GAME_CONFIG.bountyReward,
          type: 'EXECUTION_BOUNTY',
          description: `Executed NFT #${targetTokenId} - Bounty reward`,
        },
      });

      // Update executor's total points
      await tx.mst_users.update({
        where: { id: executor.id },
        data: {
          points: {
            increment: GAME_CONFIG.bountyReward,
          },
        },
      });

      // Forfeit any unclaimed earnings to treasury
      const daysStaked = targetNFT.stakedAt ? 
        Math.floor((Date.now() - targetNFT.stakedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      // Log the execution action
      await tx.auditLog.create({
        data: {
          action: 'EXECUTE',
          actorId: executor.id,
          targetId: targetNFT.userId,
          tokenId: targetTokenId,
          metadata: {
            targetOwner: targetNFT.user.address,
            daysStaked,
            gameDay: gameState.currentGameDay,
            hoursOverdue: nftStatus.hoursOverdue,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return executedNFT;
    });

    return NextResponse.json({
      success: true,
      message: `NFT #${targetTokenId} has been executed and sent to the graveyard`,
      data: {
        targetTokenId,
        executorReward: GAME_CONFIG.bountyReward,
        executedAt: result.deathDate,
        gameDay: gameState.currentGameDay,
        hoursOverdue: nftStatus.hoursOverdue,
        causeOfDeath: result.causeOfDeath,
      },
    });
  } catch (error) {
    console.error('Error processing execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}