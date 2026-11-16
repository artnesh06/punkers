import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';
import { getCurrentTax, GAME_CONFIG, syncConfigFromDB } from '@/lib/services/game-engine';
import { getGameState } from '@/lib/services/game-state-service';
import { verifyNFTOwnership } from '@/lib/services/opensea-service';
import { autoRegisterNewNFTs } from '@/lib/services/staking-service';
import { isGameLocked } from '@/lib/services/game-session-service';

// In-memory lock to prevent concurrent tax payments per user
const taxLocks = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    await syncConfigFromDB();

    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const { address, tokenId } = await request.json();

    // Validate input
    if (!address || !tokenId) {
      return NextResponse.json(
        { error: 'Address and tokenId are required' },
        { status: 400 }
      );
    }

    if (!validateAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();
    const lockKey = `${normalizedAddress}:${tokenId}`;

    // Prevent concurrent tax payments for the same NFT
    if (taxLocks.has(lockKey)) {
      return NextResponse.json(
        { error: 'Tax payment already in progress. Please wait.' },
        { status: 429 }
      );
    }
    taxLocks.add(lockKey);

    try {
    // Find user first
    const user = await prisma.mst_users.findUnique({
      where: { address: normalizedAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if NFT is staked
    const stakedNFT = await prisma.mst_staker.findFirst({
      where: {
        userId: user.id,
        tokenId: tokenId,
        isStaked: true,
        isDead: false,
      },
    });

    if (!stakedNFT) {
      return NextResponse.json(
        { error: 'NFT is not currently staked or is dead' },
        { status: 404 }
      );
    }

    // Verify user still owns this NFT (detect transfers/listings)
    const stillOwned = await verifyNFTOwnership(normalizedAddress, tokenId);
    if (!stillOwned) {
      // Auto-unstake: NFT was transferred/listed, forfeit all unclaimed $PUNK
      await prisma.mst_staker.update({
        where: { id: stakedNFT.id },
        data: { isStaked: false, unstakedAt: new Date() },
      });
      await prisma.auditLog.create({
        data: {
          action: 'AUTO_UNSTAKE_TRANSFER',
          targetId: user.id,
          tokenId,
          metadata: { reason: 'NFT no longer owned. Auto-unstaked, all unclaimed $PUNK forfeited.' },
        },
      });
      return NextResponse.json(
        { error: 'NFT is no longer in your wallet. It has been auto-unstaked and all unclaimed $PUNK is forfeited.' },
        { status: 400 }
      );
    }

    // Get current game state
    const gameState = await getGameState();
    const globalGameDay = gameState.currentGameDay;
    const baseTax = getCurrentTax(globalGameDay);

    // Calculate if in grace period (AUDITED status)
    const now = new Date();
    // Use lastTaxPayment with fallback to stakedAt (consistent with other endpoints)
    const lastPayment = stakedNFT.lastTaxPayment || stakedNFT.stakedAt;
    let hoursOverdue = 0;
    let isAudited = false;
    let penalty = 0;
    let totalTax = baseTax;

    if (lastPayment) {
      hoursOverdue = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60);
      
      // Overdue = EXECUTED status, cannot pay tax anymore
      if (hoursOverdue >= GAME_CONFIG.executionGracePeriodHours) {
        return NextResponse.json(
          { 
            error: `NFT is past execution threshold (${GAME_CONFIG.executionGracePeriodHours}h+ overdue). Tax payment is no longer possible. Any player can execute this NFT.`,
            hoursOverdue: Number.parseFloat(hoursOverdue.toFixed(1)),
            executionThreshold: GAME_CONFIG.executionGracePeriodHours,
            lastPayment: lastPayment.toISOString(),
          },
          { status: 400 }
        );
      }

      // 24-48h overdue AND already audited = pay tax + 20% penalty
      // Penalty only applies if another player has audited this NFT
      if (hoursOverdue >= GAME_CONFIG.auditGracePeriodHours && stakedNFT.lastAudit) {
        isAudited = true;
        penalty = Math.floor(baseTax * (GAME_CONFIG.auditPenaltyPercent / 100));
        totalTax = baseTax + penalty;
      }
    }

    // Check if user has enough balance
    const pointsSum = await prisma.trn_point.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });
    const currentBalance = pointsSum._sum.points || 0;

    if (currentBalance < totalTax) {
      return NextResponse.json(
        {
          error: 'Insufficient $PUNK balance',
          required: totalTax,
          current: currentBalance,
          deficit: totalTax - currentBalance,
        },
        { status: 400 }
      );
    }

    // Process payment in transaction
    await prisma.$transaction([
      // Deduct tax from user points field
      prisma.mst_users.update({
        where: { id: user.id },
        data: {
          points: {
            decrement: totalTax,
          },
        },
      }),

      // Update staker
      prisma.mst_staker.update({
        where: { id: stakedNFT.id },
        data: {
          lastTaxPayment: now,
          lastAudit: null,
          updatedAt: now,
        },
      }),

      // Create transaction record
      prisma.trn_point.create({
        data: {
          userId: user.id,
          points: -totalTax,
          description: isAudited
            ? `Tax payment for NFT #${tokenId} (AUDITED - includes ${penalty} $PUNK penalty)`
            : `Tax payment for NFT #${tokenId}`,
          type: 'TAX_PAYMENT',
        },
      }),
    ]);

    const remainingBalance = currentBalance - totalTax;

    // Calculate next tax due
    const gracePeriodMs = GAME_CONFIG.auditGracePeriodHours * 60 * 60 * 1000;
    const nextTaxDue = new Date(now.getTime() + gracePeriodMs);

    // Auto-register any new NFTs in the user's wallet
    let autoRegistered: string[] = [];
    try {
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
      if (contractAddress) {
        const collection = await prisma.mst_collection.findUnique({
          where: { contractAddress: contractAddress.toLowerCase() },
        });
        if (collection) {
          const result = await autoRegisterNewNFTs(normalizedAddress, user.id, collection.id);
          autoRegistered = result.registered;
        }
      }
    } catch (autoRegError) {
      console.warn('Auto-registration failed (non-blocking):', autoRegError);
    }

    return NextResponse.json({
      success: true,
      message: isAudited 
        ? `Tax payment successful (AUDITED status - paid ${penalty} $PUNK penalty)`
        : 'Tax payment successful',
      data: {
        tokenId,
        taxPaid: totalTax,
        baseTax,
        penalty,
        wasAudited: isAudited,
        hoursOverdue: hoursOverdue.toFixed(1),
        lastTaxPayment: now,
        nextTaxDue,
        remainingBalance,
      },
      autoRegistered,
    });
    } finally {
      taxLocks.delete(lockKey);
    }
  } catch (error) {
    console.error('Error processing tax payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}