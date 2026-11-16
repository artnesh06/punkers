import { prisma } from '@/lib/prisma';
import { LeaderboardEntry } from '@/types/api';

export async function getLeaderboard(
  page: number = 1,
  limit: number = 50
): Promise<{
  entries: LeaderboardEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEntries: number;
    hasMore: boolean;
  };
}> {
  const skip = (page - 1) * limit;

  // Get total count of users
  const totalEntries = await prisma.mst_users.count();

  // Get users with their NFT counts and points
  const users = await prisma.mst_users.findMany({
    skip,
    take: limit,
    orderBy: {
      points: 'desc',
    },
    include: {
      stakers: {
        select: {
          id: true,
          isStaked: true,
        },
      },
    },
  });

  // Transform to leaderboard entries
  const entries: LeaderboardEntry[] = users.map((user, index) => ({
    rank: skip + index + 1,
    address: user.address,
    points: user.points,
    totalPoints: user.points,
    nftCount: user.stakers.length,
    nftsOwned: user.stakers.length,
    nftsAlive: user.stakers.filter((staker) => staker.isStaked).length,
  }));

  const totalPages = Math.ceil(totalEntries / limit);

  return {
    entries,
    pagination: {
      currentPage: page,
      totalPages,
      totalEntries,
      hasMore: page < totalPages,
    },
  };
}
