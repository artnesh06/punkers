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

    const { auditorAddress, targetTokenId } = await request.json();

    // Validate input
    if (!auditorAddress || !targetTokenId) {
      return NextResponse.json(
        { error: 'Auditor address and target token ID are required' },
        { status: 400 }
      );
    }

    if (!validateAddress(auditorAddress)) {
      return NextResponse.json(
        { error: 'Invalid auditor wallet address' },
        { status: 400 }
      );
    }

    // Find auditor user
    const auditor = await prisma.mst_users.findUnique({
      where: { address: auditorAddress.toLowerCase() },
    });

    if (!auditor) {
      return NextResponse.json(
        { error: 'Auditor not found. Please connect wallet first.' },
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
        { error: 'Target NFT not found or not eligible for audit' },
        { status: 404 }
      );
    }

    // Check if NFT is eligible for audit
    // Use lastTaxPayment with fallback to stakedAt (consistent with staking-service)
    const effectiveLastPayment = targetNFT.lastTaxPayment || targetNFT.stakedAt;
    const nftStatus = getNFTStatus(effectiveLastPayment);
    
    if (!nftStatus.canBeAudited) {
      return NextResponse.json(
        { error: 'Target NFT is not eligible for audit yet (must be overdue 24+ hours)' },
        { status: 400 }
      );
    }

    // Prevent self-audit (can't audit your own NFT for bounty)
    if (targetNFT.userId === auditor.id) {
      return NextResponse.json(
        { error: 'You cannot audit your own NFT' },
        { status: 400 }
      );
    }

    // Check if already audited recently
    if (targetNFT.lastAudit) {
      const timeSinceAudit = Date.now() - targetNFT.lastAudit.getTime();
      const auditCooldown = GAME_CONFIG.auditGracePeriodHours * 60 * 60 * 1000;
      if (timeSinceAudit < auditCooldown) {
        return NextResponse.json(
          { error: 'NFT was already audited recently' },
          { status: 400 }
        );
      }
    }

    const gameState = await getGameState();

    // Perform audit in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update target NFT status
      const updatedNFT = await tx.mst_staker.update({
        where: { id: targetNFT.id },
        data: {
          lastAudit: new Date(),
          updatedAt: new Date(),
        },
      });

      // Reward auditor
      await tx.trn_point.create({
        data: {
          userId: auditor.id,
          points: GAME_CONFIG.bountyReward,
          type: 'AUDIT_BOUNTY',
          description: `Audited NFT #${targetTokenId} - Bounty reward`,
        },
      });

      // Update auditor's total points
      await tx.mst_users.update({
        where: { id: auditor.id },
        data: {
          points: {
            increment: GAME_CONFIG.bountyReward,
          },
        },
      });

      // Log the audit action
      await tx.auditLog.create({
        data: {
          action: 'AUDIT',
          actorId: auditor.id,
          targetId: targetNFT.userId,
          tokenId: targetTokenId,
          metadata: {
            targetOwner: targetNFT.user.address,
            gameDay: gameState.currentGameDay,
            hoursOverdue: nftStatus.hoursOverdue,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return updatedNFT;
    });

    return NextResponse.json({
      success: true,
      message: `NFT #${targetTokenId} has been audited successfully`,
      data: {
        targetTokenId,
        auditorReward: GAME_CONFIG.bountyReward,
        auditedAt: result.lastAudit,
        gameDay: gameState.currentGameDay,
        hoursOverdue: nftStatus.hoursOverdue,
      },
    });
  } catch (error) {
    console.error('Error processing audit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}