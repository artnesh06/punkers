import { NextRequest, NextResponse } from 'next/server';
import { getWinners } from '@/lib/services/winner-snapshot-service';
import { validatePagination } from '@/lib/utils/validation';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * GET /api/game/winners?gameId=uuid&page=1&limit=50
 * Get winners for a completed game (public, no auth required)
 *
 * Query parameters:
 * - gameId: UUID of the ended game session (required)
 * - page: Page number (default: 1, must be >= 1)
 * - limit: Items per page (default: 50, must be 1-100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const gameId = searchParams.get('gameId');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    logApiRequest(
      'GET',
      `/api/game/winners?gameId=${gameId}&page=${pageParam || '1'}&limit=${limitParam || '50'}`
    );

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;

    const validation = validatePagination(page, limit);
    if (!validation.isValid) {
      throw new ValidationError(validation.error!);
    }

    // If no gameId provided, find the latest ended game
    let game;
    if (gameId) {
      game = await prisma.mst_game.findUnique({
        where: { id: gameId },
      });
    } else {
      game = await prisma.mst_game.findFirst({
        where: { status: 'ended' },
        orderBy: { endedAt: 'desc' },
      });
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Game session not found' },
        { status: 404 }
      );
    }

    if (game.status !== 'ended') {
      return NextResponse.json(
        { error: 'Game has not ended yet' },
        { status: 404 }
      );
    }

    const { winners, total } = await getWinners(game.id, page, limit);
    const totalPages = Math.ceil(total / limit);

    logInfo('Successfully fetched winners', {
      gameId: game.id,
      page,
      limit,
      winnersCount: winners.length,
      totalWinners: total,
    });

    return NextResponse.json(
      {
        success: true,
        winners,
        pagination: {
          currentPage: page,
          totalPages,
          totalWinners: total,
          hasMore: page < totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/game/winners',
      method: 'GET',
    });
  }
}
