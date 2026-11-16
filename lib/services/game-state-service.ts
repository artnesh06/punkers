/**
 * Game State Service
 * Manages global game state, game day, and survival statistics
 */

import { getPrismaClient } from '@/lib/prisma';
import { getGameDay, getCurrentTax, GAME_CONFIG, determineNFTRarity, syncConfigFromDB } from './game-engine';
import { getActiveGameSession, checkAndEndGame } from './game-session-service';
import { createWinnerSnapshot } from './winner-snapshot-service';
import { getCollectionNFTs, getNFTsByContract } from './opensea-service';

const prisma = getPrismaClient();

export interface GameState {
  gameStartDate: Date;
  currentGameDay: number;
  currentTaxRate: number;
  totalStaked: number;
  totalAlive: number;
  totalDead: number;
  survivorsRemaining: number;
  isGameActive: boolean;
  isGameComplete: boolean;
}

export interface SurvivalStats {
  commonAlive: number;
  epicAlive: number;
  legendaryAlive: number;
  artAlive: number;
  totalExecutions: number;
  totalAudits: number;
  totalKills: number;
}

/**
 * Get or create game state
 * Checks mst_game for an active session first; falls back to gameState table if none exists.
 * Triggers auto-end flow (checkAndEndGame + createWinnerSnapshot) when isGameComplete is detected.
 */
export async function getGameState(): Promise<GameState> {
  try {
    // Sync config from DB so admin changes take effect
    await syncConfigFromDB();

    // 1. Check mst_game for an active session first
    const activeSession = await getActiveGameSession();

    if (activeSession) {
      // Use mst_game session data — survivorsRemaining already computed by getActiveGameSession
      const currentGameDay = activeSession.currentGameDay;
      const currentTaxRate = activeSession.currentTaxRate;
      const survivorsRemaining = activeSession.survivorsRemaining;

      // Count dead and total staked (survivorsRemaining = alive count, reuse it)
      const [deadCount, totalStaked] = await Promise.all([
        prisma.mst_staker.count({ where: { isDead: true } }),
        prisma.mst_staker.count({ where: { isStaked: true } }),
      ]);

      // Game is only complete if enough participants have entered the game.
      // Without this guard, a newly started game with few/no stakers would
      // immediately trigger "GAME OVER" because survivorsRemaining <= survivorTarget.
      const totalParticipants = totalStaked + deadCount;
      const hasEnoughParticipants = totalParticipants > activeSession.survivorTarget;
      const isGameComplete =
        (hasEnoughParticipants && survivorsRemaining <= activeSession.survivorTarget) ||
        (hasEnoughParticipants && currentGameDay > activeSession.durationDays);

      // Auto-end detection: trigger end-game flow when complete
      if (isGameComplete) {
        try {
          const ended = await checkAndEndGame();
          if (ended) {
            await createWinnerSnapshot(activeSession.id);
          }
        } catch (endError) {
          // Guard against race condition: if another request already ended the game,
          // endGameSession will throw because status is no longer "active". That's fine.
          console.warn('Auto-end race condition (safe to ignore):', endError);
        }
      }

      return {
        gameStartDate: activeSession.startDate,
        currentGameDay,
        currentTaxRate,
        totalStaked,
        totalAlive: survivorsRemaining,
        totalDead: deadCount,
        survivorsRemaining,
        isGameActive: !isGameComplete,
        isGameComplete,
      };
    }

    // 2. Fall back to existing gameState table logic (backward compat)
    const gameState = await prisma.gameState.findFirst() ??
      await prisma.gameState.create({
        data: {
          gameStartDate: new Date(),
          isActive: true,
          totalStaked: 0,
          totalAlive: 0,
          totalDead: 0,
        },
      });

    const currentGameDay = getGameDay(gameState.gameStartDate);
    const currentTaxRate = getCurrentTax(currentGameDay);
    
    // Count current alive/dead NFTs
    const aliveCount = await prisma.mst_staker.count({
      where: {
        isStaked: true,
        isDead: false,
      },
    });

    const deadCount = await prisma.mst_staker.count({
      where: {
        isDead: true,
      },
    });

    const totalStaked = await prisma.mst_staker.count({
      where: {
        isStaked: true,
      },
    });

    const survivorsRemaining = aliveCount;
    // Game is only complete if it has actually started with enough participants
    // and survivors have dropped to the target, OR duration exceeded.
    // Without this guard, a fresh game with 0 stakers would immediately show "GAME OVER".
    const totalParticipants = totalStaked + deadCount;
    const hasEnoughParticipants = totalParticipants > GAME_CONFIG.survivorTarget;
    const isGameComplete =
      (hasEnoughParticipants && survivorsRemaining <= GAME_CONFIG.survivorTarget) ||
      (hasEnoughParticipants && currentGameDay > GAME_CONFIG.gameDurationDays);

    return {
      gameStartDate: gameState.gameStartDate,
      currentGameDay,
      currentTaxRate,
      totalStaked,
      totalAlive: aliveCount,
      totalDead: deadCount,
      survivorsRemaining,
      isGameActive: gameState.isActive && !isGameComplete,
      isGameComplete,
    };
  } catch (error) {
    console.error('Error getting game state:', error);
    throw new Error('Failed to get game state');
  }
}

/**
 * Get survival statistics by rarity.
 * Builds a rarity map from OpenSea traits, then counts alive stakers per rarity.
 */
export async function getSurvivalStats(): Promise<SurvivalStats> {
  try {
    const totalExecutions = await prisma.mst_staker.count({
      where: { isDead: true },
    });

    const totalAudits = await prisma.auditLog.count({
      where: { action: 'AUDIT' },
    });

    const totalKills = await prisma.auditLog.count({
      where: { action: 'EXECUTION' },
    });

    // Build rarity map from OpenSea traits
    const rarityMap = new Map<string, string>();
    try {
      const collectionSlug = process.env.OPENSEA_COLLECTION_SLUG;
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
      let cursor: string | undefined;
      do {
        let result;
        if (collectionSlug) {
          result = await getCollectionNFTs(collectionSlug, 200, cursor);
        } else if (contractAddress) {
          result = await getNFTsByContract(contractAddress, 200, cursor);
        } else {
          break;
        }
        for (const nft of result.nfts) {
          const traits = nft.traits || [];
          rarityMap.set(String(nft.identifier), determineNFTRarity(nft.identifier, traits));
        }
        cursor = result.next || undefined;
      } while (cursor);
    } catch (err) {
      console.warn('Could not fetch rarity data from OpenSea:', err);
    }

    // Get alive stakers and count by rarity
    const aliveStakers = await prisma.mst_staker.findMany({
      where: { isStaked: true, isDead: false },
      select: { tokenId: true },
    });

    let commonAlive = 0;
    let epicAlive = 0;
    let legendaryAlive = 0;
    let artAlive = 0;

    for (const staker of aliveStakers) {
      const rarity = rarityMap.get(staker.tokenId) || 'common';
      if (rarity === 'legendary') legendaryAlive++;
      else if (rarity === 'epic') epicAlive++;
      else if (rarity === 'art') artAlive++;
      else commonAlive++;
    }

    return {
      commonAlive,
      epicAlive,
      legendaryAlive,
      artAlive,
      totalExecutions,
      totalAudits,
      totalKills,
    };
  } catch (error) {
    console.error('Error getting survival stats:', error);
    throw new Error('Failed to get survival stats');
  }
}

/**
 * Update game state (called periodically or on major events)
 */
export async function updateGameState(): Promise<void> {
  try {
    const gameState = await prisma.gameState.findFirst();
    if (!gameState) return;

    const currentGameDay = getGameDay(gameState.gameStartDate);
    const isGameComplete = currentGameDay > GAME_CONFIG.gameDurationDays;

    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        isActive: !isGameComplete,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating game state:', error);
  }
}

/**
 * Get leaderboard with survival status
 */
export async function getLeaderboard(limit: number = 100): Promise<Array<{
  address: string;
  totalPoints: number;
  stakedNFTs: number;
  aliveNFTs: number;
  deadNFTs: number;
  rank: number;
}>> {
  try {
    const users = await prisma.mst_users.findMany({
      orderBy: { points: 'desc' },
      take: limit,
      include: {
        stakers: {
          select: {
            isStaked: true,
            isDead: true,
          },
        },
      },
    });

    return users.map((user, index) => {
      const stakedNFTs = user.stakers.filter(s => s.isStaked).length;
      const aliveNFTs = user.stakers.filter(s => s.isStaked && !s.isDead).length;
      const deadNFTs = user.stakers.filter(s => s.isDead).length;

      return {
        address: user.address,
        totalPoints: user.points,
        stakedNFTs,
        aliveNFTs,
        deadNFTs,
        rank: index + 1,
      };
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw new Error('Failed to get leaderboard');
  }
}

/**
 * Get NFTs that can be audited (overdue 24+ hours)
 */
export async function getAuditableNFTs(): Promise<Array<{
  tokenId: string;
  ownerAddress: string;
  hoursOverdue: number;
  taxOwed: number;
}>> {
  try {
    const gameState = await getGameState();
    const cutoffTime = new Date(Date.now() - GAME_CONFIG.auditGracePeriodHours * 60 * 60 * 1000);

    const overdue = await prisma.mst_staker.findMany({
      where: {
        isStaked: true,
        isDead: false,
        OR: [
          { lastTaxPayment: { lt: cutoffTime } },
          { lastTaxPayment: null, stakedAt: { lt: cutoffTime } },
        ],
      },
      include: {
        user: {
          select: { address: true },
        },
      },
    });

    return overdue.map(staker => {
      const lastPayment = staker.lastTaxPayment || staker.stakedAt;
      const hoursOverdue = lastPayment 
        ? (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60)
        : 0;
      
      const taxOwed = getCurrentTax(gameState.currentGameDay);

      return {
        tokenId: staker.tokenId,
        ownerAddress: staker.user.address,
        hoursOverdue,
        taxOwed,
      };
    });
  } catch (error) {
    console.error('Error getting auditable NFTs:', error);
    return [];
  }
}

/**
 * Get NFTs that can be executed (overdue 48+ hours)
 */
export async function getExecutableNFTs(): Promise<Array<{
  tokenId: string;
  ownerAddress: string;
  hoursOverdue: number;
  taxOwed: number;
}>> {
  try {
    const gameState = await getGameState();
    const cutoffTime = new Date(Date.now() - GAME_CONFIG.executionGracePeriodHours * 60 * 60 * 1000);

    const overdue = await prisma.mst_staker.findMany({
      where: {
        isStaked: true,
        isDead: false,
        OR: [
          { lastTaxPayment: { lt: cutoffTime } },
          { lastTaxPayment: null, stakedAt: { lt: cutoffTime } },
        ],
      },
      include: {
        user: {
          select: { address: true },
        },
      },
    });

    return overdue.map(staker => {
      const lastPayment = staker.lastTaxPayment || staker.stakedAt;
      const hoursOverdue = lastPayment 
        ? (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60)
        : 0;
      
      const taxOwed = getCurrentTax(gameState.currentGameDay);

      return {
        tokenId: staker.tokenId,
        ownerAddress: staker.user.address,
        hoursOverdue,
        taxOwed,
      };
    });
  } catch (error) {
    console.error('Error getting executable NFTs:', error);
    return [];
  }
}