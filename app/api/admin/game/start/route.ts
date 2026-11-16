import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import {
  startGameSession,
  GameSessionError,
} from '@/lib/services/game-session-service';

/**
 * POST /api/admin/game/start
 * Start a pending game session — transitions status to "active"
 *
 * REQUIRES: Admin API key in x-api-key header
 *
 * Request body:
 * { "gameId": "uuid" }
 */
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/admin/game/start');

    // Check authentication
    const authResult = requireAdmin(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      );
    }

    const game = await startGameSession(gameId);

    return NextResponse.json({ success: true, game }, { status: 200 });
  } catch (error) {
    if (error instanceof GameSessionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    return handleApiError(error, {
      endpoint: '/api/admin/game/start',
      method: 'POST',
    });
  }
}
