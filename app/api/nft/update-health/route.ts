import { NextRequest, NextResponse } from 'next/server';
import { updateNFTHealth } from '@/lib/services/nft-management-service';
import { ValidationError, handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';

/**
 * POST /api/nft/update-health
 * Update NFT health (admin/game mechanics endpoint)
 * 
 * REQUIRES: Admin API key in x-api-key header
 *
 * Request body:
 * {
 *   "tokenId": "123",
 *   "healthChange": -10,
 *   "reason": "Penalty applied"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/nft/update-health');

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

    const body = await request.json();
    const { tokenId, healthChange, reason } = body;

    // Validate required fields
    if (!tokenId) {
      throw new ValidationError('tokenId is required');
    }

    if (healthChange === undefined || healthChange === null) {
      throw new ValidationError('healthChange is required');
    }

    if (typeof healthChange !== 'number') {
      throw new ValidationError('healthChange must be a number');
    }

    // Update health
    const newHealth = await updateNFTHealth({
      tokenId,
      healthChange,
      reason,
    });

    logInfo('Successfully updated NFT health', {
      tokenId,
      healthChange,
      newHealth,
    });

    return NextResponse.json(
      {
        success: true,
        tokenId,
        newHealth,
        message: `NFT #${tokenId} health updated to ${newHealth}%`,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/nft/update-health',
      method: 'POST',
    });
  }
}
