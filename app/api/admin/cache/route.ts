import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/services/cache-service-redis';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';

/**
 * DELETE /api/admin/cache
 * Clear cache (all or specific keys)
 * 
 * REQUIRES: Admin API key in x-api-key header
 * 
 * Query parameters:
 * - key: Specific cache key to delete (optional)
 * - pattern: Pattern to match keys (optional)
 * 
 * If no parameters provided, clears all cache
 */
export async function DELETE(request: NextRequest) {
  try {
    logApiRequest('DELETE', '/api/admin/cache');

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

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const pattern = searchParams.get('pattern');

    if (key) {
      // Delete specific key
      await cacheService.delete(key);
      logInfo('Cache key deleted', { key });
      return NextResponse.json({
        success: true,
        message: `Cache key '${key}' deleted`,
      });
    }

    if (pattern) {
      // Delete keys matching pattern
      const stats = await cacheService.getStats();
      const matchingKeys = stats.keys.filter((k) => k.includes(pattern));
      for (const k of matchingKeys) {
        await cacheService.delete(k);
      }
      logInfo('Cache keys deleted by pattern', { pattern, count: matchingKeys.length });
      return NextResponse.json({
        success: true,
        message: `${matchingKeys.length} cache keys deleted`,
        deletedKeys: matchingKeys,
      });
    }

    // Clear all cache
    await cacheService.clear();
    logInfo('All cache cleared');
    return NextResponse.json({
      success: true,
      message: 'All cache cleared',
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/cache',
      method: 'DELETE',
    });
  }
}

/**
 * GET /api/admin/cache
 * Get cache statistics
 * 
 * REQUIRES: Admin API key in x-api-key header
 */
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/admin/cache');

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

    const stats = await cacheService.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/cache',
      method: 'GET',
    });
  }
}
