import { NextRequest, NextResponse } from 'next/server';
import { getGameState, getSurvivalStats } from '@/lib/services/game-state-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const gameState = await getGameState();
    const survivalStats = await getSurvivalStats();

    return NextResponse.json({
      success: true,
      gameState,
      survivalStats,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error getting game state:', error);
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}