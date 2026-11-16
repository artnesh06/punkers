import { NextRequest, NextResponse } from 'next/server';
import { getNFTsByOwner } from '@/lib/services/opensea-service';
import {
  getUserByAddress,
  createUser,
  updateStaker,
} from '@/lib/services/database-service';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import {
  ValidationError,
  DatabaseError,
  handleApiError,
} from '@/lib/utils/error-handler';
import { logApiRequest, logInfo, logError } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';
import type { UpdateOwnerResponse } from '@/types/api';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG;

/**
 * POST /api/nft/update-owner
 * Updates NFT ownership in the database based on current OpenSea data
 *
 * Request body:
 * {
 *   "address": "0x..." // Ethereum address to update
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "updatedCount": 5,
 *   "message": "Successfully updated 5 NFTs for address 0x..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Log API request
    logApiRequest('POST', '/api/nft/update-owner');

    // Parse request body
    const body = await request.json();
    const { address } = body;

    // Validate address parameter
    if (!address || typeof address !== 'string') {
      throw new ValidationError('Address parameter is required');
    }

    // Validate Ethereum address format
    if (!isValidEthereumAddress(address)) {
      throw new ValidationError('Invalid Ethereum address format');
    }

    // Get or create user
    let user = await getUserByAddress(address);
    if (!user) {
      user = await createUser(address);
      logInfo('Created new user', { address });
    }

    // Get the collection from the database
    if (!CONTRACT_ADDRESS) {
      throw new DatabaseError('Contract address not configured');
    }

    // Find or create the collection in the database
    let collection = await prisma.mst_collection.findUnique({
      where: { contractAddress: CONTRACT_ADDRESS },
    });

    if (!collection) {
      // Create a default project if it doesn't exist
      let project = await prisma.mst_project.findFirst();
      if (!project) {
        project = await prisma.mst_project.create({
          data: {
            name: 'Punkers Survival',
            leaderboard: true,
          },
        });
      }

      // Create the collection
      collection = await prisma.mst_collection.create({
        data: {
          projectId: project.id,
          contractAddress: CONTRACT_ADDRESS,
          name: 'Punkers',
          symbol: 'PUNK',
        },
      });
      logInfo('Created new collection', { contractAddress: CONTRACT_ADDRESS });
    }

    // Get NFTs owned by the address from OpenSea
    const { nfts } = await getNFTsByOwner(address, COLLECTION_SLUG, 200);

    // Update mst_staker table with current ownership
    // IMPORTANT: Only create new records, don't overwrite existing staking status
    let updatedCount = 0;
    for (const nft of nfts) {
      try {
        // Check if staker record already exists
        const existingStaker = await prisma.mst_staker.findFirst({
          where: {
            userId: user.id,
            collectionId: collection.id,
            tokenId: nft.identifier,
          },
        });

        if (!existingStaker) {
          // Only create new record if it doesn't exist
          await prisma.mst_staker.create({
            data: {
              userId: user.id,
              collectionId: collection.id,
              tokenId: nft.identifier,
              isStaked: false, // New NFTs start as unstaked
              stakedAt: null,
              unstakedAt: null,
            },
          });
          updatedCount++;
        }
        // If record exists, don't touch it - preserve staking status
      } catch (error) {
        logError(
          `Error updating staker for token ${nft.identifier}`,
          error as Error,
          {
            tokenId: nft.identifier,
            address,
          }
        );
        // Continue with other NFTs even if one fails
      }
    }

    logInfo('Successfully updated NFT ownership', {
      address,
      updatedCount,
      totalNfts: nfts.length,
    });

    return NextResponse.json(
      {
        success: true,
        updatedCount,
        message: `Successfully updated ${updatedCount} NFTs for address ${address}`,
      } as UpdateOwnerResponse,
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/nft/update-owner',
      method: 'POST',
    });
  }
}
