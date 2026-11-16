import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { getActiveGameSession } from '@/lib/services/game-session-service';

/**
 * GET /api/admin/game/active
 * Get the currently active game session with computed fields
 *
 * REQUIRES: Admin API key in x-api-key header
 *
 * Response: { success: true, game: MstGame | null }
 */
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/admin/game/active');

    // Check authentication
    const authResult = requireAdmin(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const game = await getActiveGameSession();

    return NextResponse.json({ success: true, game }, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/game/active',
      method: 'GET',
    });
  }
}
