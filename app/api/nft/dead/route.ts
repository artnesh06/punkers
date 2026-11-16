import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { getNFTDetails } from '@/lib/services/opensea-service';

/**
 * GET /api/nft/dead?address=0x...
 * Get all dead NFTs for a specific address
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    logApiRequest('GET', `/api/nft/dead${address ? `?address=${address}` : ''}`);

    let user = null;
    let whereClause: any = { isDead: true };

    if (address) {
      if (!isValidEthereumAddress(address)) {
        throw new ValidationError('Invalid Ethereum address format');
      }

      user = await prisma.mst_users.findUnique({
        where: { address: address.toLowerCase() },
      });

      if (!user) {
        return NextResponse.json(
          { deadNFTs: [], totalDeaths: 0, totalPointsLost: 0 },
          { status: 200 }
        );
      }
      whereClause.userId = user.id;
    }

    // Get dead NFTs based on where clause (either one user or all users globally)
    const deadStakers = await prisma.mst_staker.findMany({
      where: whereClause,
      include: {
        collection: true,
        user: true, // Include user to show original owner in graveyard
      },
      orderBy: {
        deathDate: 'desc',
      },
      take: 200, // Limit global graveyard to prevent massive payloads
    });

    // Fetch flower counts from trn_flower for all dead tokenIds
    const tokenIds = deadStakers.map((s) => s.tokenId);
    const flowerCounts = await prisma.trn_flower.groupBy({
      by: ['tokenId'],
      where: { tokenId: { in: tokenIds } },
      _count: { id: true },
    });
    const flowerCountMap = new Map(
      flowerCounts.map((f) => [f.tokenId, f._count.id])
    );

    // Get game start date for computing executedDay
    const gameState = await prisma.gameState.findFirst();
    const gameStartDate = gameState?.gameStartDate || new Date();

    // Calculate statistics
    let totalPointsLost = 0;
    let totalDaysAlive = 0;
    let totalPenaltiesPaid = 0;

    // Determine "recent" threshold (deaths within last 3 days)
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 3);

    // Get contract address for fetching NFT metadata
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

    const deadNFTs = await Promise.all(deadStakers.map(async (staker) => {
      // Calculate days alive
      let daysAlive = 0;
      if (staker.stakedAt && staker.deathDate) {
        const duration =
          staker.deathDate.getTime() - staker.stakedAt.getTime();
        daysAlive = Math.floor(duration / (1000 * 60 * 60 * 24));
      }

      // Calculate executed day (game day when death occurred)
      let executedDay = 0;
      if (staker.deathDate) {
        const deathDuration = staker.deathDate.getTime() - gameStartDate.getTime();
        executedDay = Math.max(1, Math.floor(deathDuration / (1000 * 60 * 60 * 24)));
      }

      totalDaysAlive += daysAlive;
      totalPenaltiesPaid += Number(staker.penaltiesPaid);

      // Estimate points lost (would need to calculate based on reward config)
      const pointsLost = daysAlive * 10; // Base estimate
      totalPointsLost += pointsLost;

      // Determine if this death is recent
      const isRecent = staker.deathDate ? staker.deathDate >= recentThreshold : false;

      // Fetch NFT metadata from OpenSea
      let nftImage = '';
      let nftName = `${staker.collection.name} #${staker.tokenId}`;
      try {
        if (contractAddress) {
          const nftDetails = await getNFTDetails(contractAddress, staker.tokenId);
          if (nftDetails) {
            nftImage = nftDetails.image_url || nftDetails.display_image_url || '';
            nftName = nftDetails.name || nftName;
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch metadata for dead NFT ${staker.tokenId}:`, e);
      }

      return {
        tokenId: staker.tokenId,
        collectionName: staker.collection.name,
        causeOfDeath: staker.causeOfDeath || 'Audit Failure',
        deathDate: staker.deathDate,
        daysAlive,
        executedDay,
        pointsLost,
        penaltiesPaid: Number(staker.penaltiesPaid),
        ownerAddress: staker.user?.address || 'Unknown',
        killedBy: staker.user?.address || '',
        flowerCount: flowerCountMap.get(staker.tokenId) ?? 0,
        isRecent,
        metadata: {
          name: nftName,
          image: nftImage,
        },
      };
    }));

    const response = {
      deadNFTs,
      totalDeaths: deadNFTs.length,
      totalPointsLost,
      averageDaysAlive:
        deadNFTs.length > 0 ? Math.round(totalDaysAlive / deadNFTs.length) : 0,
      totalPenaltiesPaid,
    };

    logInfo('Successfully fetched dead NFTs', {
      address,
      totalDeaths: deadNFTs.length,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/nft/dead',
      method: 'GET',
    });
  }
}
