import { NextRequest, NextResponse } from 'next/server';
import { calculateTotalPoints } from '@/lib/services/points-calculator';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import { getUserByAddress } from '@/lib/services/database-service';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import type { TotalPointsResponse } from '@/types/api';

/**
 * GET /api/points/total?address=0x...
 * Get total points for a user address with breakdown
 *
 * Query parameters:
 * - address: Ethereum address (required)
 *
 * Response:
 * {
 *   "address": "0x...",
 *   "totalPoints": 1500,
 *   "breakdown": {
 *     "nftPoints": 1000,
 *     "attributeBonus": 200,
 *     "transactionPoints": 300
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Log API request
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    logApiRequest('GET', `/api/points/total?address=${address || ''}`);

    // Validate address parameter
    if (!address) {
      throw new ValidationError('Address query parameter is required');
    }

    // Validate Ethereum address format
    if (!isValidEthereumAddress(address)) {
      throw new ValidationError('Invalid Ethereum address format');
    }

    // Calculate total points
    const totalPoints = await calculateTotalPoints(address);

    // Get user to calculate breakdown
    const user = await getUserByAddress(address);

    // Calculate breakdown
    let nftPoints = 0;
    let transactionPoints = 0;

    if (user) {
      // Get detailed user data with relations
      const { prisma } = await import('@/lib/prisma');
      const userWithRelations = await prisma.mst_users.findUnique({
        where: { address: address.toLowerCase() },
        include: {
          stakers: {
            include: {
              collection: {
                include: {
                  rewards: true,
                },
              },
            },
          },
          transactions: true,
        },
      });

      if (userWithRelations) {
        // Calculate NFT points from CURRENTLY STAKED NFTs only
        for (const staker of userWithRelations.stakers) {
          // Only count staked NFTs
          if (!staker.isStaked || !staker.stakedAt) {
            continue;
          }

          const reward = staker.collection.rewards.find(
            (r) => r.tokenId === staker.tokenId
          );

          if (reward) {
            const now = new Date();
            const stakedDuration = now.getTime() - staker.stakedAt.getTime();
            const daysStaked = stakedDuration / (1000 * 60 * 60 * 24);
            nftPoints += Math.floor(daysStaked * reward.pointsPerDay);
          }
        }

        // Calculate transaction points (includes points from previously unstaked NFTs)
        for (const transaction of userWithRelations.transactions) {
          transactionPoints += transaction.points;
        }
      }
    }

    // Attribute bonus is the difference
    const attributeBonus = totalPoints - nftPoints - transactionPoints;

    const response: TotalPointsResponse = {
      address,
      totalPoints,
      breakdown: {
        nftPoints,
        attributeBonus: Math.max(0, attributeBonus),
        transactionPoints,
      },
    };

    logInfo('Successfully calculated total points', {
      address,
      totalPoints,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/points/total',
      method: 'GET',
    });
  }
}
