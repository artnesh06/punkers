import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNFTDetails } from '@/lib/services/opensea-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard/top
 * Returns top 1 player per category for the survival page carousel.
 * Categories: points, holders, audits, executions
 * All calculated server-side with no pagination issues.
 */
export async function GET() {
  try {
    // Get all active players with their stats in one query
    const users = await prisma.mst_users.findMany({
      where: {
        OR: [
          { stakers: { some: { isStaked: true } } },
          { transactions: { some: {} } },
        ],
      },
      select: {
        id: true,
        address: true,
        favoritePfpTokenId: true,
        stakers: {
          where: { isStaked: true },
          select: { tokenId: true },
          orderBy: { stakedAt: 'asc' },
          take: 1,
        },
        _count: { select: { stakers: { where: { isStaked: true } } } },
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, top: {} });
    }

    const userIds = users.map(u => u.id);

    // Fetch all stats in parallel
    const [pointsRanking, audits, executions] = await Promise.all([
      prisma.trn_point.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _sum: { points: true },
      }),
      prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { action: 'AUDIT', actorId: { in: userIds } },
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['actorId'],
        where: { action: 'EXECUTE', actorId: { in: userIds } },
        _count: true,
      }),
    ]);

    const pointsMap = new Map(pointsRanking.map(p => [p.userId, Math.max(0, p._sum.points || 0)]));
    const auditMap = new Map(audits.map(a => [a.actorId, a._count]));
    const execMap = new Map(executions.map(e => [e.actorId, e._count]));

    // Build enriched user list
    const enriched = users.map(u => ({
      id: u.id,
      address: u.address,
      points: pointsMap.get(u.id) || 0,
      nftCount: u._count.stakers,
      audits: auditMap.get(u.id) || 0,
      executions: execMap.get(u.id) || 0,
      pfpTokenId: u.favoritePfpTokenId || u.stakers[0]?.tokenId || null,
    }));

    // Find top 1 per category
    const topPoints = enriched.sort((a, b) => b.points - a.points)[0];
    const topHolders = [...enriched].sort((a, b) => b.nftCount - a.nftCount)[0];
    const topAuditsEntry = [...enriched].sort((a, b) => b.audits - a.audits)[0];
    const topExecutionsEntry = [...enriched].sort((a, b) => b.executions - a.executions)[0];

    // Placeholder for categories with no activity yet
    const emptyEntry = {
      address: '0x0000000000000000000000000000000000000000',
      points: 0,
      nftCount: 0,
      audits: 0,
      executions: 0,
      pfpTokenId: null,
    };

    const categories = {
      topPunk: topPoints?.points > 0 ? topPoints : emptyEntry,
      topHolders: topHolders?.nftCount > 0 ? topHolders : emptyEntry,
      topAudits: topAuditsEntry?.audits > 0 ? topAuditsEntry : emptyEntry,
      topPoints: topPoints?.points > 0 ? topPoints : emptyEntry,
      topExecutions: topExecutionsEntry?.executions > 0 ? topExecutionsEntry : emptyEntry,
    };

    // Resolve PFP images (max 4 unique addresses, parallel)
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
    const result: Record<string, any> = {};

    const uniqueEntries = new Map<string, any>();
    for (const [, entry] of Object.entries(categories)) {
      if (entry) uniqueEntries.set(entry.address, entry);
    }

    // Resolve PFPs for unique addresses
    const pfpMap = new Map<string, string | null>();
    if (contractAddress) {
      const pfpResults = await Promise.allSettled(
        Array.from(uniqueEntries.values()).map(async (entry) => {
          if (!entry.pfpTokenId) return { address: entry.address, url: null };
          const nft = await getNFTDetails(contractAddress, entry.pfpTokenId);
          return { address: entry.address, url: nft?.image_url || nft?.display_image_url || null };
        })
      );
      for (const r of pfpResults) {
        if (r.status === 'fulfilled' && r.value) {
          pfpMap.set(r.value.address, r.value.url);
        }
      }
    }

    // Build final response
    for (const [key, entry] of Object.entries(categories)) {
      if (!entry) { result[key] = null; continue; }
      result[key] = {
        address: entry.address,
        points: entry.points,
        nftCount: entry.nftCount,
        audits: entry.audits,
        executions: entry.executions,
        pfpUrl: pfpMap.get(entry.address) || null,
      };
    }

    return NextResponse.json({ success: true, top: result }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching top leaderboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch top leaderboard' }, { status: 500 });
  }
}
