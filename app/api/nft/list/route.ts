import { NextRequest, NextResponse } from 'next/server';
import { getAllNFTsByOwner } from '@/lib/services/opensea-service';
import { prisma } from '@/lib/prisma';
import { getNFTStatus, determineNFTRarity } from '@/lib/services/game-engine';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG;

/**
 * Get ALL NFTs owned by an address using OpenSea API
 * Handles pagination server-side — returns all NFTs in one response.
 * Query params:
 * - address: wallet address (required)
 * - collection: collection slug (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const collectionParam = searchParams.get('collection');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Use collection slug from query param or env variable
    const collectionSlug = collectionParam || COLLECTION_SLUG;

    console.log(`Fetching all NFTs for address: ${address}`, collectionSlug ? `in collection: ${collectionSlug}` : '');

    // Get ALL NFTs from OpenSea (handles pagination internally)
    const nfts = await getAllNFTsByOwner(address, collectionSlug || undefined);

    console.log(`Found ${nfts.length} total NFTs from OpenSea`);

    // Filter by contract address if specified and no collection slug
    let filteredNFTs = nfts;
    if (CONTRACT_ADDRESS && !collectionSlug) {
      filteredNFTs = nfts.filter((nft: any) => 
        nft.contract.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
      );
      console.log(`Filtered to ${filteredNFTs.length} NFTs matching contract ${CONTRACT_ADDRESS}`);
    }

    // Fetch staker data
    let stakersMap = new Map();
    try {
      const user = await prisma.mst_users.findUnique({
        where: { address: address.toLowerCase() },
        include: { stakers: true }
      });
      if (user && user.stakers) {
        user.stakers.forEach((s) => {
          stakersMap.set(s.tokenId, s);
        });
      }
    } catch (e) {
      console.warn('Could not fetch staker data:', e);
    }

    // Transform to our format
    const transformedNFTs = filteredNFTs.map((nft: any) => {
      const staker = stakersMap.get(nft.identifier);
      const traits = nft.traits || [];
      const rarity = determineNFTRarity(nft.identifier, traits);
      let statusInfo = { status: 'Alive', isDead: false, health: 100 };
      
      if (staker) {
        statusInfo.isDead = staker.isDead;
        statusInfo.health = staker.health;
        if (!staker.isDead && staker.isStaked && staker.lastTaxPayment) {
          const s = getNFTStatus(staker.lastTaxPayment);
          statusInfo.status = s.status === 'audited' ? 'Audited' : 'Alive';
        } else if (staker.isDead) {
          statusInfo.status = 'RIP';
        }
      }

      return {
        tokenId: nft.identifier,
        contractAddress: nft.contract,
        owner: address,
        status: statusInfo.status,
        health: statusInfo.health,
        isDead: statusInfo.isDead,
        isStaked: staker?.isStaked || false,
        stakedDay: staker?.stakedAt ? new Date(staker.stakedAt).toLocaleDateString() : '—',
        points: 0, // Placeholder
        kills: 0,
        rarity,
        metadata: {
          name: nft.name || `#${nft.identifier}`,
          image: nft.image_url || nft.display_image_url || '',
          description: nft.description || '',
          attributes: traits,
        },
      };
    });

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs,
      count: transformedNFTs.length,
    });
  } catch (error: any) {
    console.error('Error fetching NFTs from OpenSea:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch NFTs',
        nfts: [],
      },
      { status: 500 }
    );
  }
}
