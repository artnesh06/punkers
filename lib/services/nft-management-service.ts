import { prisma } from '@/lib/prisma';

export interface KillNFTInput {
  tokenId: string;
  causeOfDeath: string;
  pointsLost?: number;
  penaltyPaid?: number;
}

export interface UpdateHealthInput {
  tokenId: string;
  healthChange: number; // Positive or negative
  reason?: string;
}

/**
 * Mark an NFT as dead
 */
export async function killNFT(input: KillNFTInput): Promise<boolean> {
  try {
    const { tokenId, causeOfDeath, pointsLost = 0, penaltyPaid = 0 } = input;

    // Find the staker
    const staker = await prisma.mst_staker.findFirst({
      where: { tokenId },
    });

    if (!staker) {
      throw new Error(`NFT with tokenId ${tokenId} not found`);
    }

    if (staker.isDead) {
      throw new Error(`NFT with tokenId ${tokenId} is already dead`);
    }

    // Update staker to mark as dead
    await prisma.mst_staker.update({
      where: { id: staker.id },
      data: {
        isDead: true,
        health: 0,
        causeOfDeath,
        deathDate: new Date(),
        isStaked: false, // Dead NFTs are automatically unstaked
        unstakedAt: new Date(),
        penaltiesPaid: {
          increment: penaltyPaid,
        },
      },
    });

    // If there are points lost, create a penalty transaction
    if (pointsLost > 0) {
      await prisma.trn_point.create({
        data: {
          userId: staker.userId,
          points: -pointsLost,
          type: 'penalty',
          description: `NFT #${tokenId} died: ${causeOfDeath}. Lost ${pointsLost} points.`,
        },
      });

      // Update user's total points
      await prisma.mst_users.update({
        where: { id: staker.userId },
        data: {
          points: {
            decrement: pointsLost,
          },
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error killing NFT:', error);
    throw error;
  }
}

/**
 * Update NFT health
 */
export async function updateNFTHealth(
  input: UpdateHealthInput
): Promise<number> {
  try {
    const { tokenId, healthChange, reason } = input;

    // Find the staker
    const staker = await prisma.mst_staker.findFirst({
      where: { tokenId },
    });

    if (!staker) {
      throw new Error(`NFT with tokenId ${tokenId} not found`);
    }

    if (staker.isDead) {
      throw new Error(`NFT with tokenId ${tokenId} is already dead`);
    }

    // Calculate new health (clamp between 0 and 100)
    const newHealth = Math.max(0, Math.min(100, staker.health + healthChange));

    // Update health
    await prisma.mst_staker.update({
      where: { id: staker.id },
      data: {
        health: newHealth,
      },
    });

    // If health drops to 0, mark as dead
    if (newHealth === 0) {
      await killNFT({
        tokenId,
        causeOfDeath: reason || 'Health Depletion',
      });
    }

    return newHealth;
  } catch (error) {
    console.error('Error updating NFT health:', error);
    throw error;
  }
}

/**
 * Record an audit for an NFT
 */
export async function recordAudit(
  tokenId: string,
  passed: boolean,
  penaltyPaid?: number
): Promise<void> {
  try {
    const staker = await prisma.mst_staker.findFirst({
      where: { tokenId },
    });

    if (!staker) {
      throw new Error(`NFT with tokenId ${tokenId} not found`);
    }

    // Update last audit time
    await prisma.mst_staker.update({
      where: { id: staker.id },
      data: {
        lastAudit: new Date(),
        penaltiesPaid: penaltyPaid
          ? {
              increment: penaltyPaid,
            }
          : undefined,
      },
    });

    // If audit failed, reduce health
    if (!passed) {
      await updateNFTHealth({
        tokenId,
        healthChange: -20, // Lose 20% health on failed audit
        reason: 'Failed Audit',
      });
    }
  } catch (error) {
    console.error('Error recording audit:', error);
    throw error;
  }
}

/**
 * Get NFT survival statistics
 */
export async function getNFTSurvivalStats(tokenId: string) {
  try {
    const staker = await prisma.mst_staker.findFirst({
      where: { tokenId },
      include: {
        collection: true,
        user: true,
      },
    });

    if (!staker) {
      return null;
    }

    // Calculate days alive
    let daysAlive = 0;
    if (staker.stakedAt) {
      const endDate = staker.deathDate || new Date();
      const duration = endDate.getTime() - staker.stakedAt.getTime();
      daysAlive = Math.floor(duration / (1000 * 60 * 60 * 24));
    }

    return {
      tokenId,
      health: staker.health,
      isDead: staker.isDead,
      isStaked: staker.isStaked,
      daysAlive,
      lastAudit: staker.lastAudit,
      causeOfDeath: staker.causeOfDeath,
      deathDate: staker.deathDate,
      penaltiesPaid: Number(staker.penaltiesPaid),
      owner: staker.user.address,
      collection: staker.collection.name,
    };
  } catch (error) {
    console.error('Error getting NFT survival stats:', error);
    throw error;
  }
}
