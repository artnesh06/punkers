import { prisma } from '@/lib/prisma';
import { NFTAttribute } from '@/types/nft';

/**
 * Calculate total points for a user address
 * 
 * Balance is the sum of all trn_point transactions.
 * All operations (claim earnings, pay tax, bounty rewards, slot, loot) 
 * create trn_point records, so this is the single source of truth.
 *
 * @param address - Ethereum address
 * @returns Total points (always >= 0)
 */
export async function calculateTotalPoints(address: string): Promise<number> {
  // Get user by address (normalize to lowercase for consistent lookup)
  const user = await prisma.mst_users.findUnique({
    where: { address: address.toLowerCase() },
  });

  if (!user) {
    return 0;
  }

  // Single source of truth: sum of all point transactions
  const pointsSum = await prisma.trn_point.aggregate({
    where: { userId: user.id },
    _sum: { points: true },
  });

  return Math.max(0, pointsSum._sum.points || 0);
}

/**
 * Calculate points for a specific NFT based on its tokenId and attributes
 *
 * @param tokenId - NFT token ID
 * @param attributes - NFT attributes
 * @returns Points for this NFT
 */
export async function calculateNFTPoints(
  tokenId: string,
  attributes: NFTAttribute[]
): Promise<number> {
  // Find the reward configuration for this NFT across all collections
  const reward = await prisma.mst_reward.findFirst({
    where: { tokenId },
  });

  if (!reward) {
    return 0;
  }

  // Base points per day from the reward configuration
  let points = reward.pointsPerDay;

  // Add attribute bonuses
  const attributeBonus = await calculateAttributeBonus(attributes);
  points += attributeBonus;

  return points;
}

/**
 * Calculate bonus points based on NFT attributes
 * Looks up attribute bonuses in mst_attributes_reward table
 *
 * @param attributes - Array of NFT attributes
 * @returns Total bonus points from attributes
 */
export async function calculateAttributeBonus(
  attributes: NFTAttribute[]
): Promise<number> {
  let bonusPoints = 0;

  // Query all attribute rewards that match the given attributes
  for (const attribute of attributes) {
    const attributeReward = await prisma.mst_attributes_reward.findFirst({
      where: {
        traitType: attribute.trait_type,
        traitValue: String(attribute.value),
      },
    });

    if (attributeReward) {
      bonusPoints += attributeReward.bonusPoints;
    }
  }

  return bonusPoints;
}
