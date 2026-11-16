import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';

/**
 * GET /api/nft/health?tokenId=123
 * Get health status for a specific NFT
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    logApiRequest('GET', `/api/nft/health?tokenId=${tokenId || ''}`);

    // Validate tokenId parameter
    if (!tokenId) {
      throw new ValidationError('TokenId query parameter is required');
    }

    // Find staker by tokenId
    const staker = await prisma.mst_staker.findFirst({
      where: { tokenId },
      include: {
        collection: true,
        user: true,
      },
    });

    if (!staker) {
      return NextResponse.json(
        {
          tokenId,
          health: 100,
          status: 'unknown',
          message: 'NFT not found in staking system',
        },
        { status: 404 }
      );
    }

    // Determine status
    let status = 'healthy';
    if (staker.isDead) {
      status = 'dead';
    } else if (staker.health < 30) {
      status = 'critical';
    } else if (staker.health < 60) {
      status = 'warning';
    }

    const response = {
      tokenId,
      health: staker.health,
      status,
      isDead: staker.isDead,
      isStaked: staker.isStaked,
      lastAudit: staker.lastAudit,
      causeOfDeath: staker.causeOfDeath,
      deathDate: staker.deathDate,
      owner: staker.user.address,
      collection: {
        name: staker.collection.name,
        contractAddress: staker.collection.contractAddress,
      },
    };

    logInfo('Successfully fetched NFT health', {
      tokenId,
      health: staker.health,
      status,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/nft/health',
      method: 'GET',
    });
  }
}
