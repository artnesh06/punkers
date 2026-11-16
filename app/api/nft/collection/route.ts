import { NextRequest, NextResponse } from 'next/server';
import { getCollectionNFTs, getNFTsByContract } from '@/lib/services/opensea-service';
import { determineNFTRarity } from '@/lib/services/game-engine';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
const COLLECTION_SLUG = process.env.OPENSEA_COLLECTION_SLUG;

/**
 * Fetch one page of NFTs from OpenSea
 */
async function fetchPage(limit: number, next?: string) {
  if (COLLECTION_SLUG) {
    return await getCollectionNFTs(COLLECTION_SLUG, limit, next);
  } else if (CONTRACT_ADDRESS) {
    return await getNFTsByContract(CONTRACT_ADDRESS, limit, next);
  }
  return null;
}

function transformNFTs(nfts: any[]) {
  return nfts.map((nft: any) => {
    const traits = nft.traits || [];
    const rarity = determineNFTRarity(nft.identifier, traits);
    return {
      tokenId: nft.identifier,
      contractAddress: nft.contract,
      owner: nft.owners?.[0]?.address || nft.owner || null,
      rarity,
      metadata: {
        name: nft.name || `#${nft.identifier}`,
        image: nft.image_url || nft.display_image_url || '',
        description: nft.description || '',
        attributes: traits,
      },
    };
  });
}

/**
 * Get NFTs in the collection (not filtered by owner)
 * Query params:
 * - fetchAll: if "true", auto-paginate server-side and return all NFTs
 * - limit: number of items per page (optional, default 50, max 200)
 * - next: pagination cursor (optional, ignored when fetchAll=true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get('fetchAll') === 'true';

    if (!COLLECTION_SLUG && !CONTRACT_ADDRESS) {
      return NextResponse.json(
        { success: false, error: 'No collection slug or contract address configured' },
        { status: 500 }
      );
    }

    if (fetchAll) {
      // Server-side auto-pagination: fetch all pages in one API call
      const allNfts: any[] = [];
      let cursor: string | undefined = undefined;
      const maxPages = 50; // safety limit
      let pages = 0;

      do {
        const result = await fetchPage(200, cursor);
        if (!result) break;
        allNfts.push(...result.nfts);
        cursor = result.next || undefined;
        pages++;
      } while (cursor && pages < maxPages);

      const transformedNFTs = transformNFTs(allNfts);

      return NextResponse.json({
        success: true,
        nfts: transformedNFTs,
        count: transformedNFTs.length,
        next: null,
      });
    }

    // Single page fetch (original behavior)
    const limitParam = searchParams.get('limit') || '50';
    const limit = Math.min(Number.parseInt(limitParam, 10), 200);
    const next = searchParams.get('next') || undefined;

    const result = await fetchPage(limit, next);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'No collection slug or contract address configured' },
        { status: 500 }
      );
    }

    const transformedNFTs = transformNFTs(result.nfts);

    return NextResponse.json({
      success: true,
      nfts: transformedNFTs,
      count: transformedNFTs.length,
      next: result.next,
    });
  } catch (error: any) {
    console.error('Error fetching collection NFTs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch collection NFTs', nfts: [] },
      { status: 500 }
    );
  }
}
