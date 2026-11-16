import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';
import {
  createGameSession,
  GameSessionError,
} from '@/lib/services/game-session-service';

/**
 * POST /api/admin/game/create
 * Create a new game session with status "pending"
 *
 * REQUIRES: Admin API key in x-api-key header
 *
 * Request body:
 * {
 *   "season": 1,
 *   "name": "Season 1",
 *   "startDate": "2025-01-15T00:00:00Z",
 *   "durationDays": 60,
 *   "survivorTarget": 500
 * }
 */
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/admin/game/create');

    // Check authentication
    const authResult = requireAdmin(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = await rateLimitAdmin(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { season, name, startDate, durationDays, survivorTarget } = body;

    const game = await createGameSession({
      season,
      name,
      startDate: startDate ? new Date(startDate) : undefined as any,
      durationDays,
      survivorTarget,
    });

    return NextResponse.json({ success: true, game }, { status: 201 });
  } catch (error) {
    if (error instanceof GameSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return handleApiError(error, {
      endpoint: '/api/admin/game/create',
      method: 'POST',
    });
  }
}
