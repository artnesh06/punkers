import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils/error-handler';
import { logApiRequest, logInfo } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { rateLimitAdmin } from '@/lib/middleware/rate-limit-redis';

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 * 
 * REQUIRES: Admin API key in x-api-key header
 */
export async function GET(request: NextRequest) {
  try {
    logApiRequest('GET', '/api/admin/dashboard');

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

    // Get comprehensive statistics
    const [
      totalUsers,
      totalNFTs,
      stakedNFTs,
      deadNFTs,
      criticalHealthNFTs,
      recentDeaths,
      recentAudits,
      topUsers,
    ] = await Promise.all([
      // Total users
      prisma.mst_users.count(),

      // Total NFTs
      prisma.mst_staker.count(),

      // Staked NFTs
      prisma.mst_staker.count({
        where: { isStaked: true, isDead: false },
      }),

      // Dead NFTs
      prisma.mst_staker.count({
        where: { isDead: true },
      }),

      // Critical health NFTs (health < 30)
      prisma.mst_staker.count({
        where: {
          isDead: false,
          health: { lt: 30 },
        },
      }),

      // Recent deaths (last 7 days)
      prisma.mst_staker.findMany({
        where: {
          isDead: true,
          deathDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: {
            select: { address: true },
          },
          collection: {
            select: { name: true },
          },
        },
        orderBy: { deathDate: 'desc' },
        take: 10,
      }),

      // Recent audits (last 24 hours)
      prisma.mst_staker.findMany({
        where: {
          lastAudit: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: {
            select: { address: true },
          },
        },
        orderBy: { lastAudit: 'desc' },
        take: 10,
      }),

      // Top users by points
      prisma.mst_users.findMany({
        orderBy: { points: 'desc' },
        take: 10,
        select: {
          address: true,
          points: true,
          _count: {
            select: { stakers: true },
          },
        },
      }),
    ]);

    // Calculate health distribution
    const healthDistribution = await prisma.mst_staker.groupBy({
      by: ['health'],
      where: { isDead: false },
      _count: true,
    });

    // Group by health ranges
    const healthRanges = {
      critical: 0, // 0-29
      warning: 0, // 30-59
      good: 0, // 60-89
      excellent: 0, // 90-100
    };

    healthDistribution.forEach((item) => {
      if (item.health < 30) healthRanges.critical += item._count;
      else if (item.health < 60) healthRanges.warning += item._count;
      else if (item.health < 90) healthRanges.good += item._count;
      else healthRanges.excellent += item._count;
    });

    // Calculate death causes distribution
    const deathCauses = await prisma.mst_staker.groupBy({
      by: ['causeOfDeath'],
      where: { isDead: true },
      _count: true,
    });

    const response = {
      overview: {
        totalUsers,
        totalNFTs,
        stakedNFTs,
        deadNFTs,
        criticalHealthNFTs,
        survivalRate: totalNFTs > 0 ? ((totalNFTs - deadNFTs) / totalNFTs) * 100 : 0,
      },
      healthDistribution: healthRanges,
      deathCauses: deathCauses.map((item) => ({
        cause: item.causeOfDeath || 'Unknown',
        count: item._count,
      })),
      recentActivity: {
        deaths: recentDeaths.map((death) => ({
          tokenId: death.tokenId,
          collection: death.collection.name,
          owner: death.user.address,
          causeOfDeath: death.causeOfDeath,
          deathDate: death.deathDate,
        })),
        audits: recentAudits.map((audit) => ({
          tokenId: audit.tokenId,
          owner: audit.user.address,
          lastAudit: audit.lastAudit,
          health: audit.health,
        })),
      },
      topUsers: topUsers.map((user, index) => ({
        rank: index + 1,
        address: user.address,
        points: user.points,
        nftCount: user._count.stakers,
      })),
    };

    logInfo('Successfully fetched admin dashboard', {
      totalUsers,
      totalNFTs,
      deadNFTs,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/admin/dashboard',
      method: 'GET',
    });
  }
}
