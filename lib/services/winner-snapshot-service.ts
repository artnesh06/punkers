/**
 * Winner Snapshot Service
 * Encapsulates ranking logic and snapshot creation for game winners.
 * Creates mst_winner records for all surviving NFTs when a game ends.
 */

import { getPrismaClient } from '@/lib/prisma';
import { determineNFTRarity } from './game-engine';
import { getCollectionNFTs, getNFTsByContract } from './opensea-service';

const prisma = getPrismaClient();

const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

/**
 * Build a tokenId → NFTRarity map by fetching all collection NFTs from OpenSea.
 * Falls back to 'common' for any token not found.
 */
async function buildRarityMap(): Promise<Map<string, string>> {
  const rarityMap = new Map<string, string>();
  try {
    let cursor: string | undefined;
    do {
      let result;
      if (COLLECTION_SLUG) {
        result = await getCollectionNFTs(COLLECTION_SLUG, 200, cursor);
      } else if (CONTRACT_ADDRESS) {
        result = await getNFTsByContract(CONTRACT_ADDRESS, 200, cursor);
      } else {
        break;
      }
      for (const nft of result.nfts) {
        const traits = nft.traits || [];
        const rarity = determineNFTRarity(nft.identifier, traits);
        rarityMap.set(String(nft.identifier), rarity);
      }
      cursor = result.next || undefined;
    } while (cursor);
  } catch (err) {
    console.warn('Could not build rarity map from OpenSea, falling back to common:', err);
  }
  return rarityMap;
}

/**
 * Creates winner records for all surviving (alive + staked) NFTs, ranked by total points.
 * Idempotent: if a snapshot already exists for the gameId, returns existing records.
 */
export async function createWinnerSnapshot(gameId: string) {
  // Check if snapshot already exists — idempotent
  const existingWinners = await prisma.mst_winner.findMany({
    where: { gameId },
    orderBy: { rank: 'asc' },
  });

  if (existingWinners.length > 0) {
    return existingWinners;
  }

  // Get the game session to determine endedAt for survivedDays calculation
  const game = await prisma.mst_game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new Error(`Game session not found: ${gameId}`);
  }

  const endedAt = game.endedAt ?? new Date();

  // Query all alive staked NFTs with their user data (for points and address)
  const aliveStakers = await prisma.mst_staker.findMany({
    where: {
      isStaked: true,
      isDead: false,
    },
    include: {
      user: true,
    },
  });

  if (aliveStakers.length === 0) {
    return [];
  }

  // Build rarity map from OpenSea traits
  const rarityMap = await buildRarityMap();

  // Build winner data with totalPoints from user.points, sorted by totalPoints DESC
  const winnersData = aliveStakers
    .map((staker) => {
      const survivedDays = staker.stakedAt
        ? Math.max(
            1,
            Math.ceil(
              (endedAt.getTime() - staker.stakedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

      return {
        gameId,
        userId: staker.userId,
        address: staker.user.address,
        tokenId: staker.tokenId,
        totalPoints: staker.user.points,
        rarity: rarityMap.get(staker.tokenId) || 'common',
        survivedDays,
      };
    })
    // Sort by totalPoints descending, then by survivedDays descending as tiebreaker
    .sort((a, b) => b.totalPoints - a.totalPoints || b.survivedDays - a.survivedDays);

  // Assign dense ranks (tied scores get the same rank)
  let currentRank = 1;
  const winnersWithRanks = winnersData.map((winner, index) => {
    if (index > 0 && winner.totalPoints < winnersData[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return { ...winner, rank: currentRank };
  });

  // Batch create all winner records
  await prisma.mst_winner.createMany({
    data: winnersWithRanks,
  });

  // Update game with participant counts
  const [totalParticipants, totalDead] = await Promise.all([
    prisma.mst_staker.count({ where: { isStaked: true } }),
    prisma.mst_staker.count({ where: { isDead: true } }),
  ]);

  await prisma.mst_game.update({
    where: { id: gameId },
    data: {
      totalParticipants,
      totalSurvivors: aliveStakers.length,
      totalDead,
    },
  });

  // Return the created records ordered by rank
  return prisma.mst_winner.findMany({
    where: { gameId },
    orderBy: { rank: 'asc' },
  });
}

/**
 * Returns paginated mst_winner records for a completed game, ordered by rank ASC.
 */
export async function getWinners(
  gameId: string,
  page: number = 1,
  limit: number = 50
) {
  const skip = (page - 1) * limit;

  const [winners, total] = await Promise.all([
    prisma.mst_winner.findMany({
      where: { gameId },
      orderBy: { rank: 'asc' },
      skip,
      take: limit,
    }),
    prisma.mst_winner.count({
      where: { gameId },
    }),
  ]);

  return { winners, total };
}

/**
 * Checks if any mst_winner records exist for the given gameId.
 */
export async function hasSnapshot(gameId: string): Promise<boolean> {
  const count = await prisma.mst_winner.count({
    where: { gameId },
  });

  return count > 0;
}
