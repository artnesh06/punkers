import { getPrismaClient } from '@/lib/prisma';
import { 
  getCurrentEarning, 
  getCurrentTax,
  getPersonalStakeDay,
  getGameDay,
  determineNFTRarity,
  GAME_CONFIG,
  type NFTRarity,
  syncConfigFromDB,
} from './game-engine';
import { getNFTsByOwner, getAllNFTsByOwner, verifyNFTOwnershipByAccount, getNFTDetails } from './opensea-service';
import { isGameLocked } from './game-session-service';
import type { Staker } from '@/types/database';

const prisma = getPrismaClient();

export interface StakingStatus {
  isStaked: boolean;
  stakedAt?: Date;
  unstakedAt?: Date;
  estimatedPoints: number;
}

export interface StakingResult {
  success: boolean;
  message?: string;
  staker?: Staker;
}

export interface StakedNFT {
  tokenId: string;
  collectionId: string;
  stakedAt: Date;
  estimatedPoints: number;
  lastTaxPayment?: Date;
  lastClaimDate?: Date;
  nextTaxDue?: Date;
  rarity: NFTRarity;
  personalStakeDay: number;
  globalGameDay: number;
  dailyEarning: number;
  dailyTax: number;
  netDaily: number;
  status: 'ALIVE' | 'AUDITED' | 'EXECUTED';
}

/**
 * Get staking status for a specific NFT (read from database)
 */
export async function getStakingStatus(
  address: string,
  tokenId: string
): Promise<StakingStatus> {
  try {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Find user by address
    const user = await prisma.mst_users.findUnique({
      where: { address: normalizedAddress },
    });

    if (!user) {
      return {
        isStaked: false,
        estimatedPoints: 0,
      };
    }

    // Find staker record
    const staker = await prisma.mst_staker.findFirst({
      where: {
        userId: user.id,
        tokenId,
      },
      include: {
        collection: {
          include: {
            rewards: {
              where: { tokenId },
            },
          },
        },
      },
    });

    if (!staker) {
      return {
        isStaked: false,
        estimatedPoints: 0,
      };
    }

    // Calculate estimated points per day using game engine
    const personalStakeDay = staker.stakedAt 
      ? getPersonalStakeDay(staker.stakedAt)
      : 1;
    
    // Fetch traits from OpenSea for accurate rarity detection
    let traits: Array<{ trait_type: string; value: string | number }> = [];
    try {
      const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
      if (contractAddress) {
        const nftDetails = await getNFTDetails(contractAddress, tokenId);
        traits = nftDetails?.traits || [];
      }
    } catch (e) {
      console.warn(`Could not fetch traits for token ${tokenId}:`, e);
    }
    const rarity = determineNFTRarity(tokenId, traits);
    const estimatedPoints = getCurrentEarning(personalStakeDay, rarity);

    return {
      isStaked: staker.isStaked,
      stakedAt: staker.stakedAt || undefined,
      unstakedAt: staker.unstakedAt || undefined,
      estimatedPoints,
    };
  } catch (error) {
    console.error('Error getting staking status:', error);
    throw new Error('Failed to get staking status');
  }
}

/**
 * Stake NFT (database update only - no blockchain transaction)
 * User must be authenticated first via /api/auth/verify
 */
export async function stakeNFT(
  address: string,
  tokenId: string
): Promise<StakingResult> {
  try {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Check if game is locked (ended)
    const locked = await isGameLocked();
    if (locked) {
      return {
        success: false,
        message: 'Game has ended',
      };
    }
    
    // Find user by address
    const user = await prisma.mst_users.findUnique({
      where: { address: normalizedAddress },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not authenticated. Please sign in with your wallet first.',
      };
    }

    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      return {
        success: false,
        message: 'NFT contract address not configured',
      };
    }

    // Find or create collection
    let collection = await prisma.mst_collection.findUnique({
      where: { contractAddress: contractAddress.toLowerCase() },
    });

    if (!collection) {
      // Create project first if not exists
      let project = await prisma.mst_project.findFirst();
      
      if (!project) {
        project = await prisma.mst_project.create({
          data: {
            name: 'Punkers Survival',
            leaderboard: true,
          },
        });
      }

      // Create collection
      collection = await prisma.mst_collection.create({
        data: {
          projectId: project.id,
          contractAddress: contractAddress.toLowerCase(),
          name: 'Punkers',
          symbol: 'PUNK',
          totalSupply: 5000,
        },
      });
    }

    // Find existing staker record (by tokenId — may belong to previous owner)
    let staker = await prisma.mst_staker.findFirst({
      where: {
        collectionId: collection.id,
        tokenId,
      },
    });

    if (staker) {
      // Record exists — transfer ownership to current wallet holder
      if (staker.userId !== user.id) {
        staker = await prisma.mst_staker.update({
          where: { id: staker.id },
          data: {
            userId: user.id,
            isStaked: false,
            isDead: false,
            health: 100,
            stakedAt: null,
            unstakedAt: null,
            lastTaxPayment: null,
            lastClaimDate: null,
          },
        });
      }
    } else {
      // No record exists — create new
      staker = await prisma.mst_staker.create({
        data: {
          userId: user.id,
          collectionId: collection.id,
          tokenId,
          isStaked: false,
          health: 100,
        },
      });
    }

    if (staker.isStaked) {
      return {
        success: false,
        message: 'NFT is already staked',
      };
    }

    if (staker.isDead) {
      return {
        success: false,
        message: 'This NFT is dead and cannot be staked',
      };
    }

    // Verify user actually owns this NFT (prevent staking NFTs you don't own)
    // Use account-based ownership check which is more reliable for recent transfers
    // than the NFT details endpoint (which may have stale owner data)
    const isOwner = await verifyNFTOwnershipByAccount(normalizedAddress, tokenId);
    if (!isOwner) {
      return {
        success: false,
        message: 'You do not own this NFT',
      };
    }

    // Update staker record - database only, no blockchain transaction
    const updatedStaker = await prisma.mst_staker.update({
      where: { id: staker.id },
      data: {
        isStaked: true,
        stakedAt: new Date(),
        unstakedAt: null,
        lastTaxPayment: new Date(), // Set initial tax payment to now
        lastClaimDate: new Date(),  // Set initial claim date to now
      },
    });

    return {
      success: true,
      message: 'NFT staked successfully',
      staker: updatedStaker as unknown as Staker,
    };
  } catch (error) {
    console.error('Error staking NFT:', error);
    throw error;
  }
}

/**
 * Unstake NFT — BLOCKED per game rules
 * 
 * Per official PUNKERS rules:
 * "There is no unstake button. Once you stake, you're in until you survive or die."
 */
export async function unstakeNFT(): Promise<StakingResult> {
  return {
    success: false,
    message: 'Unstaking is not allowed. Once you stake, you\'re in until you survive or die.',
  };
}

/**
 * Get all staked NFTs for an address with game mechanics
 */
export async function getStakedNFTs(address: string): Promise<StakedNFT[]> {
  try {
    await syncConfigFromDB();

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Find user by address
    const user = await prisma.mst_users.findUnique({
      where: { address: normalizedAddress },
    });

    if (!user) {
      return [];
    }

    // Find all staked NFTs
    const stakers = await prisma.mst_staker.findMany({
      where: {
        userId: user.id,
        isStaked: true,
        isDead: false, // Only alive NFTs
      },
      include: {
        collection: {
          include: {
            rewards: true,
          },
        },
      },
    });

    // Get game state for global day calculation
    const gameState = await prisma.gameState.findFirst();
    const gameStartDate = gameState?.gameStartDate || new Date();
    const globalGameDay = getGameDay(gameStartDate);
    const currentTaxRate = getCurrentTax(globalGameDay);

    // Fetch all NFT traits from OpenSea (with full pagination) for accurate rarity detection
    const traitsMap = new Map<string, Array<{ trait_type: string; value: string | number }>>();
    try {
      const collectionSlug = process.env.OPENSEA_COLLECTION_SLUG;
      const openseaNFTs = await getAllNFTsByOwner(normalizedAddress, collectionSlug || undefined);
      for (const nft of openseaNFTs) {
        if (nft.identifier && nft.traits) {
          traitsMap.set(String(nft.identifier), nft.traits);
        }
      }
    } catch (e) {
      console.warn('Could not fetch NFT traits from OpenSea, rarity will default to common:', e);
    }

    return stakers
      .filter((staker) => staker.stakedAt !== null) // Extra safety check
      .map((staker) => {
        // Calculate personal stake day using game engine
        const personalStakeDay = staker.stakedAt 
          ? getPersonalStakeDay(staker.stakedAt)
          : 1;
        
        // Determine rarity from traits (fetched from OpenSea)
        const traits = traitsMap.get(staker.tokenId) || [];
        const rarity = determineNFTRarity(staker.tokenId, traits);
        
        // Calculate daily earning based on personal day and rarity
        const dailyEarning = getCurrentEarning(personalStakeDay, rarity);
        const dailyTax = currentTaxRate;
        const netDaily = dailyEarning - dailyTax;
        const estimatedPoints = dailyEarning;

        // Calculate next tax due date
        const gracePeriodMs = GAME_CONFIG.auditGracePeriodHours * 60 * 60 * 1000;
        let nextTaxDue: Date | undefined;
        if (staker.lastTaxPayment) {
          nextTaxDue = new Date(staker.lastTaxPayment.getTime() + gracePeriodMs);
        } else if (staker.stakedAt) {
          nextTaxDue = new Date(staker.stakedAt.getTime() + gracePeriodMs);
        }

        // Determine NFT status based on last tax payment
        let status: 'ALIVE' | 'AUDITED' | 'EXECUTED' = 'ALIVE';
        const lastPayment = staker.lastTaxPayment || staker.stakedAt;
        if (lastPayment) {
          const hoursSincePayment = (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60);
          if (hoursSincePayment >= GAME_CONFIG.executionGracePeriodHours) {
            status = 'EXECUTED';
          } else if (hoursSincePayment >= GAME_CONFIG.auditGracePeriodHours) {
            status = 'AUDITED';
          }
        }

        return {
          tokenId: staker.tokenId,
          collectionId: staker.collectionId,
          stakedAt: staker.stakedAt as Date,
          estimatedPoints,
          lastTaxPayment: staker.lastTaxPayment || undefined,
          lastClaimDate: staker.lastClaimDate || undefined,
          nextTaxDue,
          rarity,
          personalStakeDay,
          globalGameDay,
          dailyEarning,
          dailyTax,
          netDaily,
          status,
        };
      });
  } catch (error) {
    console.error('Error getting staked NFTs:', error);
    throw error;
  }
}


/**
 * Auto-register new NFTs for an existing participant.
 * Fetches current wallet NFTs from OpenSea, compares with existing mst_staker records,
 * and creates new staker records for any missing NFTs with isStaked=true.
 *
 * Fail-open: if OpenSea API fails, logs a warning and returns empty (doesn't block the caller).
 *
 * @param address - Wallet address of the participant
 * @param userId - Database user ID
 * @param collectionId - Database collection ID
 * @returns Object with array of newly registered token IDs
 */
export async function autoRegisterNewNFTs(
  address: string,
  userId: string,
  collectionId: string
): Promise<{ registered: string[] }> {
  try {
    const collectionSlug = process.env.OPENSEA_COLLECTION_SLUG;

    // Fetch current wallet NFTs from OpenSea
    const { nfts } = await getNFTsByOwner(address, collectionSlug, 200);

    if (!nfts || nfts.length === 0) {
      return { registered: [] };
    }

    const walletTokenIds = nfts.map((nft: any) => nft.identifier as string);

    // Get existing staker records for this user
    const existingStakers = await prisma.mst_staker.findMany({
      where: { userId, collectionId },
      select: { tokenId: true },
    });
    const ownedTokenIds = new Set(existingStakers.map((s) => s.tokenId));

    // Find NFTs in wallet that this user doesn't have staker records for
    const unregisteredTokenIds = walletTokenIds.filter(
      (tokenId: string) => !ownedTokenIds.has(tokenId)
    );

    if (unregisteredTokenIds.length === 0) {
      return { registered: [] };
    }

    const now = new Date();
    const registered: string[] = [];

    for (const tokenId of unregisteredTokenIds) {
      // Check if a staker record exists from a previous owner
      const existingRecord = await prisma.mst_staker.findFirst({
        where: { collectionId, tokenId },
      });

      if (existingRecord) {
        // Transfer ownership: reset staker to new owner, fresh start
        await prisma.mst_staker.update({
          where: { id: existingRecord.id },
          data: {
            userId,
            isStaked: true,
            isDead: false,
            health: 100,
            stakedAt: now,
            unstakedAt: null,
            lastTaxPayment: now,
            lastClaimDate: now,
            causeOfDeath: null,
            deathDate: null,
          },
        });
      } else {
        // Brand new NFT — create staker record
        await prisma.mst_staker.create({
          data: {
            userId,
            collectionId,
            tokenId,
            isStaked: true,
            stakedAt: now,
            lastTaxPayment: now,
            lastClaimDate: now,
            health: 100,
          },
        });
      }
      registered.push(tokenId);
    }

    return { registered };
  } catch (error) {
    // Fail-open: log warning and skip — don't block the parent operation
    console.warn(
      `Auto-registration failed for address ${address}:`,
      error
    );
    return { registered: [] };
  }
}
