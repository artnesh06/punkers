import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';
import { getCurrentTax, GAME_CONFIG, syncConfigFromDB } from '@/lib/services/game-engine';
import { getGameState } from '@/lib/services/game-state-service';
import { autoRegisterNewNFTs } from '@/lib/services/staking-service';
import { isGameLocked } from '@/lib/services/game-session-service';
import { verifyNFTOwnership } from '@/lib/services/opensea-service';

// In-memory lock to prevent concurrent bulk tax payments per user
const taxAllLocks = new Set<string>();

/**
 * POST /api/staking/pay-tax-all
 * Pay tax for ALL overdue staked NFTs in a single transaction.
 *
 * Request body: { "address": "0x..." }
 *
 * Logic per NFT:
 *  - < 24h overdue  → base tax (no penalty)
 *  - 24–48h overdue → base tax + 20% penalty (AUDITED)
 *  - 48h+ overdue   → skipped (EXECUTED — must be killed by another player)
 */
export async function POST(request: NextRequest) {
  try {
    await syncConfigFromDB();
    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    if (!validateAddress(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const normalizedAddress = address.toLowerCase();

    // Prevent concurrent bulk tax payments for the same user
    if (taxAllLocks.has(normalizedAddress)) {
      return NextResponse.json(
        { error: 'Bulk tax payment already in progress. Please wait.' },
        { status: 429 }
      );
    }
    taxAllLocks.add(normalizedAddress);

    try {
    const user = await prisma.mst_users.findUnique({
      where: { address: normalizedAddress },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all alive staked NFTs
    const stakedNFTs = await prisma.mst_staker.findMany({
      where: { userId: user.id, isStaked: true, isDead: false },
    });

    if (stakedNFTs.length === 0) {
      return NextResponse.json({ error: 'No staked NFTs found' }, { status: 400 });
    }

    const gameState = await getGameState();
    const baseTax = getCurrentTax(gameState.currentGameDay);
    const now = new Date();

    // Calculate tax for each overdue NFT
    let totalTaxDue = 0;
    const paidNFTs: { tokenId: string; tax: number; penalty: number; wasAudited: boolean }[] = [];
    const skippedExecuted: string[] = [];
    const skippedNotDue: string[] = [];
    const autoUnstaked: string[] = [];

    for (const nft of stakedNFTs) {
      const lastPayment = nft.lastTaxPayment || nft.stakedAt;
      if (!lastPayment) {
        skippedNotDue.push(nft.tokenId);
        continue;
      }

      const hoursOverdue = (now.getTime() - lastPayment.getTime()) / (1000 * 60 * 60);

      // 48h+ — executed, can't pay anymore
      if (hoursOverdue >= GAME_CONFIG.executionGracePeriodHours) {
        skippedExecuted.push(nft.tokenId);
        continue;
      }

      // Verify ownership — auto-unstake if transferred/sold
      const stillOwned = await verifyNFTOwnership(normalizedAddress, nft.tokenId);
      if (!stillOwned) {
        await prisma.mst_staker.update({
          where: { id: nft.id },
          data: { isStaked: false, unstakedAt: now },
        });
        autoUnstaked.push(nft.tokenId);
        continue;
      }

      // 24–48h AND already audited by another player — tax + penalty
      if (hoursOverdue >= GAME_CONFIG.auditGracePeriodHours && nft.lastAudit) {
        const penalty = Math.floor(baseTax * (GAME_CONFIG.auditPenaltyPercent / 100));
        const nftTax = baseTax + penalty;
        totalTaxDue += nftTax;
        paidNFTs.push({ tokenId: nft.tokenId, tax: nftTax, penalty, wasAudited: true });
      } else {
        // Not audited or < 24h — pay base tax only, resets the timer
        totalTaxDue += baseTax;
        paidNFTs.push({ tokenId: nft.tokenId, tax: baseTax, penalty: 0, wasAudited: false });
      }
    }

    if (paidNFTs.length === 0) {
      return NextResponse.json({
        error: 'No NFTs with unpaid tax',
        skippedExecuted,
        skippedNotDue: skippedNotDue.length,
      }, { status: 400 });
    }

    // Check balance first (quick pre-check before transaction)
    const pointsSum = await prisma.trn_point.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });
    const currentBalance = pointsSum._sum.points || 0;

    if (currentBalance < totalTaxDue) {
      return NextResponse.json({
        error: 'Insufficient $PUNK balance',
        required: totalTaxDue,
        current: currentBalance,
        deficit: totalTaxDue - currentBalance,
        nftCount: paidNFTs.length,
      }, { status: 400 });
    }

    // Collect all tokenIds to update in a single query
    const paidTokenIds = paidNFTs.map(({ tokenId }) => tokenId);

    // Execute as batched transaction (no timeout issues)
    await prisma.$transaction([
      // Deduct total tax
      prisma.mst_users.update({
        where: { id: user.id },
        data: { points: { decrement: totalTaxDue } },
      }),
      // Single aggregated transaction record
      prisma.trn_point.create({
        data: {
          userId: user.id,
          points: -totalTaxDue,
          description: `Bulk tax payment for ${paidNFTs.length} NFT(s): ${totalTaxDue} $PUNK total`,
          type: 'TAX_PAYMENT',
        },
      }),
      // Update lastTaxPayment for ALL paid NFTs in a single query
      prisma.mst_staker.updateMany({
        where: { userId: user.id, tokenId: { in: paidTokenIds }, isStaked: true },
        data: { lastTaxPayment: now, lastAudit: null, updatedAt: now },
      }),
    ]);

    const remainingBalance = currentBalance - totalTaxDue;

    // Auto-register new NFTs (non-blocking)
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
      message: `Paid tax for ${paidNFTs.length} NFT(s) — ${totalTaxDue} $PUNK total`,
      data: {
        totalTaxPaid: totalTaxDue,
        paidNFTs,
        skippedExecuted,
        skippedNotDue: skippedNotDue.length,
        autoUnstaked,
        remainingBalance,
      },
      autoRegistered,
    });
    } finally {
      taxAllLocks.delete(normalizedAddress);
    }
  } catch (error) {
    console.error('Error processing bulk tax payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
