import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logInfo, logError } from '@/lib/utils/logger';

/**
 * GET /api/health
 * Health check endpoint that verifies database connectivity
 *
 * Response:
 * {
 *   "status": "ok" | "error",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "database": "connected" | "disconnected",
 *   "message": "optional error message"
 * }
 */
export async function GET() {
  try {
    // Check database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;

    logInfo('Health check passed', { database: 'connected' });

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    logError('Health check failed', error as Error, {
      endpoint: '/api/health',
    });

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message:
          error instanceof Error ? error.message : 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
