import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';

/**
 * POST /api/admin/reset-game
 * Reset game to day 0 - delete all transactions but keep users and certificates
 * 
 * REQUIRES: Admin API key in x-api-key header
 */
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/admin/reset-game');

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
          }
        }
      );
    }

    // Execute reset in a transaction
    // Order matters: delete child tables (FK dependencies) before parent tables
    await prisma.$transaction(async (tx) => {
      // 1. Delete child tables that reference mst_game
      await tx.mst_winner.deleteMany({});

      // 2. Delete child tables that reference mst_users
      await tx.trn_point.deleteMany({});
      await tx.trn_participant.deleteMany({});
      await tx.trn_loot_open.deleteMany({});

      // 3. Delete child tables that reference mst_collection + mst_users
      await tx.mst_staker.deleteMany({});

      // 4. Delete tables with no FK constraints
      await tx.trn_slot_spin.deleteMany({});
      await tx.auditLog.deleteMany({});

      // 5. Delete game sessions (start fresh, no leftover pending/ended games)
      await tx.mst_game.deleteMany({});

      // 6. Delete game state (will be auto-created on first getGameState call)
      await tx.gameState.deleteMany({});

      // 7. Reset user $PUNK balance to 0 (keep accounts intact)
      await tx.mst_users.updateMany({
        data: { points: 0 },
      });
    });

    logInfo('Game reset to day 0 completed');

    return NextResponse.json({
      success: true,
      message: 'Game reset to day 0 successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/reset-game',
      method: 'POST',
    });
  }
}
