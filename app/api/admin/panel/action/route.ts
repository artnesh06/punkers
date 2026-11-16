import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import {
  createGameSession,
  startGameSession,
  endGameSession,
  GameSessionError,
} from '@/lib/services/game-session-service';
import { createWinnerSnapshot } from '@/lib/services/winner-snapshot-service';

/**
 * POST /api/admin/panel/action — Execute admin actions (cookie auth)
 * Body: { action: string, ...params }
 */
export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'createGame': {
        const game = await createGameSession({
          season: body.season,
          name: body.name,
          startDate: new Date(body.startDate),
          durationDays: body.durationDays,
          survivorTarget: body.survivorTarget,
        });
        return NextResponse.json({ success: true, game });
      }

      case 'startGame': {
        const game = await startGameSession(body.gameId);
        return NextResponse.json({ success: true, game });
      }

      case 'endGame': {
        const game = await endGameSession(body.gameId, 'manual');
        const winners = await createWinnerSnapshot(game.id);
        return NextResponse.json({ success: true, game, winnersCount: winners.length });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof GameSessionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
