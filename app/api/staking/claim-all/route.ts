import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';
import { calculateCurrentEarnings } from '@/lib/services/earning-calculator';
import { autoRegisterNewNFTs } from '@/lib/services/staking-service';
import { isGameLocked } from '@/lib/services/game-session-service';
import { verifyNFTOwnership, getNFTDetails } from '@/lib/services/opensea-service';

// In-memory lock to prevent concurrent claims per user
const claimLocks = new Set<string>();

/**
 * POST /api/staking/claim-all
 * Claim accumulated earnings for ALL staked NFTs at once
 *
 * Request body:
 * { "address": "0x..." }
 */
export async function POST(request: NextRequest) {
  try {
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

    // Prevent concurrent claims for the same user
    if (claimLocks.has(normalizedAddress)) {
      return NextResponse.json(
        { error: 'Claim already in progress. Please wait.' },
        { status: 429 }
      );
    }
    claimLocks.add(normalizedAddress);

    try {
      const user = await prisma.mst_users.findUnique({
        where: { address: normalizedAddress },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get all alive staked NFTs for this user
      const stakedNFTs = await prisma.mst_staker.findMany({
        where: { userId: user.id, isStaked: true, isDead: false },
      });

      if (stakedNFTs.length === 0) {
        return NextResponse.json({ error: 'No staked NFTs found' }, { status: 400 });
      }

      const now = new Date();
      let totalClaimed = 0;
      const claimedNFTs: { tokenId: string; earned: number }[] = [];
      const skippedNFTs: string[] = [];
      const autoUnstaked: string[] = [];

      // Calculate earnings for each NFT
      for (const nft of stakedNFTs) {
        if (!nft.stakedAt) {
          skippedNFTs.push(nft.tokenId);
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

        // Fetch NFT traits from OpenSea for accurate rarity detection
        let traits: Array<{ trait_type: string; value: string | number }> = [];
        try {
          const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
          if (contractAddress) {
            const nftDetails = await getNFTDetails(contractAddress, nft.tokenId);
            traits = nftDetails?.traits || [];
          }
        } catch (e) {
          console.warn(`Could not fetch traits for token ${nft.tokenId}, defaulting to common:`, e);
        }

        const earnings = calculateCurrentEarnings(
          nft.stakedAt,
          nft.tokenId,
          nft.lastClaimDate || nft.stakedAt,
          traits
        );

        if (earnings.totalEarned > 0) {
          totalClaimed += earnings.totalEarned;
          claimedNFTs.push({ tokenId: nft.tokenId, earned: earnings.totalEarned });
        } else {
          skippedNFTs.push(nft.tokenId);
        }
      }

      if (totalClaimed <= 0) {
        return NextResponse.json({
          error: 'No earnings to claim across any NFTs',
          skipped: skippedNFTs.length,
        }, { status: 400 });
      }

      // Get current balance
      const pointsSum = await prisma.trn_point.aggregate({
        where: { userId: user.id },
        _sum: { points: true },
      });
      const currentBalance = pointsSum._sum.points || 0;

      // Collect all claimed tokenIds for a single updateMany
      const claimedTokenIds = claimedNFTs.map(({ tokenId }) => tokenId);

      // Execute as batched transaction (single updateMany, no timeout)
      await prisma.$transaction([
        // Increment user points
        prisma.mst_users.update({
          where: { id: user.id },
          data: { points: { increment: totalClaimed } },
        }),
        // Create single aggregated transaction record
        prisma.trn_point.create({
          data: {
            userId: user.id,
            points: totalClaimed,
            description: `Claimed earnings for ${claimedNFTs.length} NFT(s): ${totalClaimed} $PUNK total`,
            type: 'EARNING_CLAIM',
          },
        }),
        // Update lastClaimDate for ALL claimed NFTs in a single query
        prisma.mst_staker.updateMany({
          where: { userId: user.id, tokenId: { in: claimedTokenIds }, isStaked: true },
          data: { lastClaimDate: now, updatedAt: now },
        }),
      ]);

      // Auto-register new NFTs (fire-and-forget)
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
        message: `Claimed ${totalClaimed} $PUNK from ${claimedNFTs.length} NFT(s)`,
        data: {
          totalClaimed,
          claimedNFTs,
          skippedNFTs,
          autoUnstaked,
          newBalance: currentBalance + totalClaimed,
        },
        autoRegistered,
      });
    } finally {
      claimLocks.delete(normalizedAddress);
    }
  } catch (error) {
    console.error('Error claiming all earnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
