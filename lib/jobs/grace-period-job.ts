/**
 * Grace Period Query
 * 
 * Read-only utility to get NFTs that are overdue on tax payments.
 * No background jobs — all actions are triggered manually by users:
 * - Tax payment: user clicks "Pay Tax"
 * - Audit: bounty hunter clicks "Audit" via /api/nft/audit
 * - Execute: bounty hunter clicks "Execute" via /api/nft/kill
 */

import { prisma } from '@/lib/prisma';
import { GAME_CONFIG } from '@/lib/services/game-engine';

/**
 * Get list of NFTs in grace period (for UI display / admin dashboard)
 * This is a READ-ONLY query — no mutations, no side effects.
 */
export async function getGracePeriodNFTs(): Promise<{
  audited: any[];
  executable: any[];
}> {
  const now = new Date();
  
  const stakedNFTs = await prisma.mst_staker.findMany({
    where: {
      isStaked: true,
      isDead: false,
      lastTaxPayment: {
        not: null,
      },
    },
    include: {
      user: true,
    },
  });

  const audited: any[] = [];
  const executable: any[] = [];

  for (const nft of stakedNFTs) {
    if (!nft.lastTaxPayment) continue;

    const hoursOverdue = (now.getTime() - nft.lastTaxPayment.getTime()) / (1000 * 60 * 60);

    if (hoursOverdue >= GAME_CONFIG.executionGracePeriodHours) {
      executable.push({
        tokenId: nft.tokenId,
        owner: nft.user.address,
        hoursOverdue: hoursOverdue.toFixed(1),
        lastPayment: nft.lastTaxPayment,
      });
    } else if (hoursOverdue >= GAME_CONFIG.auditGracePeriodHours) {
      audited.push({
        tokenId: nft.tokenId,
        owner: nft.user.address,
        hoursOverdue: hoursOverdue.toFixed(1),
        lastPayment: nft.lastTaxPayment,
      });
    }
  }

  return { audited, executable };
}
