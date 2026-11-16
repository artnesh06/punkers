import { NextRequest, NextResponse } from 'next/server';
import { killNFT, updateNFTHealth } from '@/lib/services/nft-management-service';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';

/**
 * POST /api/admin/bulk-operations
 * Perform bulk operations on NFTs
 * 
 * REQUIRES: Admin API key in x-api-key header
 * 
 * Request body:
 * {
 *   "operation": "kill" | "updateHealth" | "audit",
 *   "tokenIds": ["123", "456", "789"],
 *   "params": {
 *     // For kill operation
 *     "causeOfDeath": "Mass Audit Failure",
 *     "pointsLost": 100,
 *     
 *     // For updateHealth operation
 *     "healthChange": -20,
 *     "reason": "Penalty"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    logApiRequest('POST', '/api/admin/bulk-operations');

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
    const { operation, tokenIds, params } = body;

    // Validate input
    const validationError = validateBulkOperationInput(operation, tokenIds);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Perform bulk operation
    const results = await performBulkOperation(operation, tokenIds, params);

    logInfo('Bulk operation completed', {
      operation,
      totalTokens: tokenIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
    });

    return NextResponse.json(
      {
        success: true,
        operation,
        totalTokens: tokenIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/bulk-operations',
      method: 'POST',
    });
  }
}

/**
 * Validate bulk operation input
 */
function validateBulkOperationInput(
  operation: string,
  tokenIds: any
): string | null {
  if (!operation || !tokenIds || !Array.isArray(tokenIds)) {
    return 'Invalid request body';
  }

  if (tokenIds.length === 0) {
    return 'No token IDs provided';
  }

  if (tokenIds.length > 100) {
    return 'Maximum 100 token IDs per request';
  }

  return null;
}

/**
 * Perform bulk operation on NFTs
 */
async function performBulkOperation(
  operation: string,
  tokenIds: string[],
  params: any
) {
  const results = {
    success: [] as string[],
    failed: [] as { tokenId: string; error: string }[],
  };

  switch (operation) {
    case 'kill':
      await bulkKillNFTs(tokenIds, params, results);
      break;

    case 'updateHealth':
      await bulkUpdateHealth(tokenIds, params, results);
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return results;
}

/**
 * Bulk kill NFTs
 */
async function bulkKillNFTs(
  tokenIds: string[],
  params: any,
  results: { success: string[]; failed: { tokenId: string; error: string }[] }
) {
  for (const tokenId of tokenIds) {
    try {
      await killNFT({
        tokenId,
        causeOfDeath: params?.causeOfDeath || 'Bulk Operation',
        pointsLost: params?.pointsLost || 0,
        penaltyPaid: params?.penaltyPaid || 0,
      });
      results.success.push(tokenId);
    } catch (error) {
      results.failed.push({
        tokenId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * Bulk update health
 */
async function bulkUpdateHealth(
  tokenIds: string[],
  params: any,
  results: { success: string[]; failed: { tokenId: string; error: string }[] }
) {
  if (params?.healthChange === undefined) {
    throw new Error('healthChange is required for updateHealth operation');
  }

  for (const tokenId of tokenIds) {
    try {
      await updateNFTHealth({
        tokenId,
        healthChange: params.healthChange,
        reason: params?.reason || 'Bulk Operation',
      });
      results.success.push(tokenId);
    } catch (error) {
      results.failed.push({
        tokenId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
