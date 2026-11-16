import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { rateLimitPublic } from '@/lib/middleware/rate-limit-redis';
import { cacheService, CACHE_TTL, CACHE_KEYS } from '@/lib/services/cache-service-redis';
import { getCollectionStats } from '@/lib/services/opensea-service';

const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG || 'junkie';

/**
 * GET /api/collection/stats
 * Get collection statistics from OpenSea and database
 * Cached for 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/collection/stats');

    // Check rate limit
    const rateLimitResult = await rateLimitPublic(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    // Try to get from cache
    const cacheKey = CACHE_KEYS.collectionStats();
    const response = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Get stats from OpenSea
        let floorPrice = '-';
        let volume = '-';
        
        try {
          const stats = await getCollectionStats(COLLECTION_SLUG);
          
          if (stats.total) {
            floorPrice = stats.total.floor_price 
              ? `${stats.total.floor_price} ETH` 
              : '-';
            volume = stats.total.volume 
              ? `${Math.round(stats.total.volume)} ETH` 
              : '-';
          }
        } catch (openseaError) {
          console.warn('Could not fetch OpenSea stats:', openseaError);
        }

        // Get staked count from database
        let staked = 0;
        let totalSupply = 0;
        
        try {
          const stakedCount = await prisma.mst_staker.count({
            where: { isStaked: true },
          });
          
          const totalCount = await prisma.mst_staker.count();
          
          staked = stakedCount;
          totalSupply = totalCount;
        } catch (dbError) {
          console.warn('Could not fetch database stats:', dbError);
        }

        return {
          totalSupply,
          staked,
          floorPrice,
          volume,
          collections: [
            {
              id: 'punkers',
              name: 'Punkers',
              count: totalSupply,
            },
          ],
        };
      },
      CACHE_TTL.COLLECTION_STATS
    );

    logInfo('Successfully fetched collection stats', {
      totalSupply: response.totalSupply,
      staked: response.staked,
    });

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL.COLLECTION_STATS}, stale-while-revalidate`,
      }
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/collection/stats',
      method: 'GET',
    });
  }
}
