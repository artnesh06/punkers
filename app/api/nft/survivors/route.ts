import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { getCollectionNFTs, getNFTsByContract } from '@/lib/services/opensea-service';
import { determineNFTRarity } from '@/lib/services/game-engine';

const prisma = getPrismaClient();
const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

export const dynamic = 'force-dynamic';

/**
 * GET /api/nft/survivors
 * Returns all staked (alive) NFTs enriched with OpenSea metadata.
 * Used by the survival page to show only in-game NFTs.
 */
export async function GET() {
  try {
    // 1. Get all alive staked NFTs from database
    const aliveStakers = await prisma.mst_staker.findMany({
      where: { isStaked: true, isDead: false },
      include: {
        user: { select: { address: true } },
      },
    });

    const stakerMap = new Map<string, typeof aliveStakers[number]>();
    for (const s of aliveStakers) {
      stakerMap.set(s.tokenId, s);
    }

    // 2. Fetch all NFT metadata from OpenSea (paginated server-side)
    const allNfts: any[] = [];
    let cursor: string | undefined;
    const maxPages = 50;
    let pages = 0;

    do {
      let result;
      if (COLLECTION_SLUG) {
        result = await getCollectionNFTs(COLLECTION_SLUG, 200, cursor);
      } else if (CONTRACT_ADDRESS) {
        result = await getNFTsByContract(CONTRACT_ADDRESS, 200, cursor);
      } else {
        break;
      }
      allNfts.push(...result.nfts);
      cursor = result.next || undefined;
      pages++;
    } while (cursor && pages < maxPages);

    // 3. Build OpenSea metadata map by identifier
    const openseaMap = new Map<string, any>();
    for (const nft of allNfts) {
      openseaMap.set(String(nft.identifier), nft);
    }

    // 4. Build survivors list from stakers, enriched with OpenSea metadata
    const survivors = aliveStakers.map((staker) => {
      const osNft = openseaMap.get(staker.tokenId);
      const traits = osNft?.traits || [];
      const rarity = determineNFTRarity(staker.tokenId, traits);

      return {
        tokenId: staker.tokenId,
        contractAddress: osNft?.contract || CONTRACT_ADDRESS || '',
        owner: staker.user.address,
        rarity,
        stakedAt: staker.stakedAt,
        lastTaxPayment: staker.lastTaxPayment,
        lastAudit: staker.lastAudit,
        health: staker.health,
        metadata: {
          name: osNft?.name || `Punker #${staker.tokenId}`,
          image: osNft?.image_url || osNft?.display_image_url || '',
          description: osNft?.description || '',
          attributes: traits,
        },
      };
    });

    return NextResponse.json({
      success: true,
      nfts: survivors,
      count: survivors.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error fetching survivors:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch survivors', nfts: [] },
      { status: 500 }
    );
  }
}
