import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services/database-service';
import { validatePagination } from '@/lib/utils/validation';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';
import type { LeaderboardResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard?page=1&limit=50
 * Get leaderboard with pagination
 *
 * Query parameters:
 * - page: Page number (default: 1, must be >= 1)
 * - limit: Items per page (default: 50, must be 1-100)
 *
 * Response:
 * {
 *   "entries": [
 *     {
 *       "rank": 1,
 *       "address": "0x...",
 *       "points": 5000,
 *       "nftCount": 10
 *     }
 *   ],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 10,
 *     "totalEntries": 500,
 *     "hasMore": true
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    logApiRequest(
      'GET',
      `/api/leaderboard?page=${pageParam || '1'}&limit=${limitParam || '50'}`
    );

    // Parse with defaults
    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;

    // Validate pagination parameters
    const validation = validatePagination(page, limit);
    if (!validation.isValid) {
      throw new ValidationError(validation.error!);
    }

    // Get total count of active players (users with staked NFTs or point transactions)
    const totalEntries = await prisma.mst_users.count({
      where: {
        OR: [
          { stakers: { some: { isStaked: true } } },
          { transactions: { some: {} } },
        ],
      },
    });
    const totalPages = Math.ceil(totalEntries / limit);

    // Get leaderboard entries
    const entries = await getLeaderboard(page, limit);

    // Build response
    const response: LeaderboardResponse = {
      entries,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries,
        hasMore: page < totalPages,
      },
    };

    logInfo('Successfully fetched leaderboard', {
      page,
      limit,
      entriesCount: entries.length,
      totalEntries,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/leaderboard',
      method: 'GET',
    });
  }
}
