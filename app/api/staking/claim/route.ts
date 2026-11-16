import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';
import { calculateCurrentEarnings } from '@/lib/services/earning-calculator';
import { verifyNFTOwnership, getNFTDetails } from '@/lib/services/opensea-service';
import { autoRegisterNewNFTs } from '@/lib/services/staking-service';
import { isGameLocked } from '@/lib/services/game-session-service';

// In-memory lock to prevent concurrent claims per user
const claimLocks = new Set<string>();

/**
 * POST /api/staking/claim
 * Claim accumulated earnings for a staked NFT
 *
 * Request body:
 * {
 *   "address": "0x...",
 *   "tokenId": "123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const { address, tokenId } = await request.json();

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

    // Prevent concurrent claims for the same NFT
    if (claimLocks.has(lockKey)) {
      return NextResponse.json(
        { error: 'Claim already in progress. Please wait.' },
        { status: 429 }
      );
    }
    claimLocks.add(lockKey);

    try {
      const user = await prisma.mst_users.findUnique({
        where: { address: normalizedAddress },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

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

      if (!stakedNFT.stakedAt) {
        return NextResponse.json(
          { error: 'NFT stake date not found' },
          { status: 400 }
        );
      }

      // Verify user still owns this NFT
      const stillOwned = await verifyNFTOwnership(normalizedAddress, tokenId);
      if (!stillOwned) {
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

      // Fetch NFT traits from OpenSea for accurate rarity detection
      let traits: Array<{ trait_type: string; value: string | number }> = [];
      try {
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
        if (contractAddress) {
          const nftDetails = await getNFTDetails(contractAddress, tokenId);
          traits = nftDetails?.traits || [];
        }
      } catch (e) {
        console.warn(`Could not fetch traits for token ${tokenId}, defaulting to common:`, e);
      }

      const earnings = calculateCurrentEarnings(
        stakedNFT.stakedAt,
        tokenId,
        stakedNFT.lastClaimDate || stakedNFT.stakedAt,
        traits
      );

      if (earnings.totalEarned <= 0) {
        return NextResponse.json(
          {
            error: 'No earnings to claim yet',
            daysStaked: earnings.daysStaked,
            dailyRate: earnings.dailyRate,
          },
          { status: 400 }
        );
      }

      const now = new Date();

      const pointsSum = await prisma.trn_point.aggregate({
        where: { userId: user.id },
        _sum: { points: true },
      });
      const currentBalance = pointsSum._sum.points || 0;

      // Process claim in transaction
      await prisma.$transaction([
        prisma.mst_users.update({
          where: { id: user.id },
          data: { points: { increment: earnings.totalEarned } },
        }),
        prisma.mst_staker.update({
          where: { id: stakedNFT.id },
          data: { lastClaimDate: now, updatedAt: now },
        }),
        prisma.trn_point.create({
          data: {
            userId: user.id,
            points: earnings.totalEarned,
            description: `Claimed earnings for NFT #${tokenId} (${earnings.daysStaked} days @ ${earnings.dailyRate} $PUNK/day)`,
            type: 'EARNING_CLAIM',
          },
        }),
      ]);

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
        message: 'Earnings claimed successfully',
        data: {
          tokenId,
          earned: earnings.totalEarned,
          daysStaked: earnings.daysStaked,
          dailyRate: earnings.dailyRate,
          personalStakeDay: earnings.personalStakeDay,
          rarity: earnings.rarity,
          newBalance: currentBalance + earnings.totalEarned,
          lastClaimDate: now,
        },
        autoRegistered,
      });
    } finally {
      claimLocks.delete(lockKey);
    }
  } catch (error) {
    console.error('Error claiming earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
