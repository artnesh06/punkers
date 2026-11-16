import { prisma } from '@/lib/prisma';
import { getNFTDetails } from '@/lib/services/opensea-service';
import type { User, Staker, PointTransaction } from '@/types/database';

/**
 * Database service for handling all database operations
 * Provides functions for user, staker, leaderboard, and point transaction operations
 */

// ============================================================================
// User Operations
// ============================================================================

/**
 * Get user by Ethereum address
 * @param address - Ethereum address (must be unique)
 * @returns User object or null if not found
 */
export async function getUserByAddress(address: string): Promise<User | null> {
  const user = await prisma.mst_users.findUnique({
    where: { address: address.toLowerCase() },
  });

  return user;
}

/**
 * Create a new user with the given Ethereum address
 * @param address - Ethereum address
 * @returns Created user object
 */
export async function createUser(address: string): Promise<User> {
  const user = await prisma.mst_users.create({
    data: {
      address,
      points: 0,
    },
  });

  return user;
}

/**
 * Update user's total points
 * @param address - Ethereum address
 * @param points - New total points value
 */
export async function updateUserPoints(
  address: string,
  points: number
): Promise<void> {
  await prisma.mst_users.update({
    where: { address: address.toLowerCase() },
    data: { points },
  });
}

// ============================================================================
// Staker Operations
// ============================================================================

/**
 * Get all stakers (NFTs) for a given address
 * @param address - Ethereum address
 * @returns Array of staker records
 */
export async function getStakersByAddress(address: string): Promise<Staker[]> {
  // First get the user
  const user = await prisma.mst_users.findUnique({
    where: { address: address.toLowerCase() },
    include: {
      stakers: true,
    },
  });

  if (!user) {
    return [];
  }

  return user.stakers as unknown as Staker[];
}

/**
 * Input type for updating staker
 */
export interface UpdateStakerInput {
  userId: string;
  collectionId: string;
  tokenId: string;
  isStaked?: boolean;
  stakedAt?: Date | null;
  unstakedAt?: Date | null;
}

/**
 * Update or create a staker record
 * Uses upsert to handle both creation and updates
 * @param data - Staker data to update
 * @returns Updated or created staker record
 */
export async function updateStaker(data: UpdateStakerInput): Promise<Staker> {
  const { userId, collectionId, tokenId, isStaked, stakedAt, unstakedAt } =
    data;

  const staker = await prisma.mst_staker.upsert({
    where: {
      collectionId_tokenId: {
        collectionId,
        tokenId,
      },
    },
    update: {
      userId,
      ...(isStaked !== undefined && { isStaked }),
      ...(stakedAt !== undefined && { stakedAt }),
      ...(unstakedAt !== undefined && { unstakedAt }),
    },
    create: {
      userId,
      collectionId,
      tokenId,
      isStaked: isStaked ?? false,
      stakedAt: stakedAt ?? null,
      unstakedAt: unstakedAt ?? null,
    },
  });

  return staker as unknown as Staker;
}

// ============================================================================
// Leaderboard Operations
// ============================================================================

/**
 * Leaderboard entry with rank information
 */
export interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  nftCount: number;
  level: number;
  audits: number;
  executions: number;
  pfpUrl?: string;
}

/**
 * Get leaderboard with pagination
 * Shows all active players (users with staked NFTs OR point transactions).
 * Points are aggregated from trn_point as source of truth.
 * @param page - Page number (1-indexed)
 * @param limit - Number of entries per page
 * @returns Array of leaderboard entries with rank, address, points, and NFT count
 */
export async function getLeaderboard(
  page: number,
  limit: number
): Promise<LeaderboardEntry[]> {
  const skip = (page - 1) * limit;

  // Get points from trn_point (may be empty after reset)
  const pointsRanking = await prisma.trn_point.groupBy({
    by: ['userId'],
    _sum: { points: true },
  });

  const pointsMap = new Map(
    pointsRanking.map(p => [p.userId, Math.max(0, p._sum.points || 0)])
  );

  // Get all active players: users with staked NFTs OR point transactions
  const usersWithStakers = await prisma.mst_users.findMany({
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
      certificate: { select: { level: true } },
      stakers: {
        where: { isStaked: true },
        select: { tokenId: true },
        orderBy: { stakedAt: 'asc' },
        take: 1,
      },
      _count: { select: { stakers: { where: { isStaked: true } } } },
    },
  });

  if (usersWithStakers.length === 0) return [];

  // Sort by points descending, then by staker count as tiebreaker
  const sorted = usersWithStakers
    .map(u => ({
      ...u,
      points: pointsMap.get(u.id) || 0,
    }))
    .sort((a, b) => b.points - a.points || b._count.stakers - a._count.stakers);

  // Apply pagination
  const paged = sorted.slice(skip, skip + limit);
  if (paged.length === 0) return [];

  const pagedUserIds = paged.map(u => u.id);

  // Fetch audit/execution counts for this page only
  const [audits, executions] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['actorId'],
      where: { action: 'AUDIT', actorId: { in: pagedUserIds } },
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ['actorId'],
      where: { action: 'EXECUTE', actorId: { in: pagedUserIds } },
      _count: true,
    }),
  ]);

  const auditMap = new Map(audits.map(a => [a.actorId, a._count]));
  const execMap = new Map(executions.map(e => [e.actorId, e._count]));

  const entries: LeaderboardEntry[] = paged.map((u, index) => ({
    rank: skip + index + 1,
    address: u.address,
    points: u.points,
    nftCount: u._count.stakers,
    level: u.certificate?.level || 1,
    audits: auditMap.get(u.id) || 0,
    executions: execMap.get(u.id) || 0,
    // PFP token: favorite or first staked NFT
    _pfpTokenId: u.favoritePfpTokenId || u.stakers[0]?.tokenId || null,
  }));

  // Resolve PFP images from OpenSea (parallel, fail-safe)
  const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
  if (contractAddress) {
    const pfpResults = await Promise.allSettled(
      entries.map(async (entry) => {
        const tokenId = (entry as any)._pfpTokenId;
        if (!tokenId) return null;
        const nft = await getNFTDetails(contractAddress, tokenId);
        return nft?.image_url || nft?.display_image_url || null;
      })
    );
    pfpResults.forEach((result, i) => {
      entries[i].pfpUrl = result.status === 'fulfilled' ? (result.value ?? undefined) : undefined;
      delete (entries[i] as any)._pfpTokenId;
    });
  }

  // Sync mst_users.points cache in background (fire-and-forget)
  Promise.allSettled(
    entries.map(e =>
      prisma.mst_users.update({
        where: { address: e.address.toLowerCase() },
        data: { points: e.points },
      })
    )
  ).catch(() => {});

  return entries;
}

// ============================================================================
// Point Transaction Operations
// ============================================================================

/**
 * Get all point transactions for a user
 * @param address - Ethereum address
 * @returns Array of point transactions ordered by creation date (newest first)
 */
export async function getPointTransactions(
  address: string
): Promise<PointTransaction[]> {
  // First get the user
  const user = await prisma.mst_users.findUnique({
    where: { address: address.toLowerCase() },
  });

  if (!user) {
    return [];
  }

  const transactions = await prisma.trn_point.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return transactions as PointTransaction[];
}

/**
 * Input type for creating point transaction
 */
export interface CreatePointTransactionInput {
  userId: string;
  points: number;
  description?: string;
  type: 'stake' | 'unstake' | 'bonus' | 'penalty';
}

/**
 * Create a new point transaction record
 * @param data - Transaction data
 * @returns Created transaction record
 */
export async function createPointTransaction(
  data: CreatePointTransactionInput
): Promise<PointTransaction> {
  const transaction = await prisma.trn_point.create({
    data: {
      userId: data.userId,
      points: data.points,
      description: data.description ?? null,
      type: data.type,
    },
  });

  return transaction as PointTransaction;
}
