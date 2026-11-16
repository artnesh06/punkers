import { NextRequest, NextResponse } from 'next/server';
import { getNFTDetails } from '@/lib/services/opensea-service';
import { determineNFTRarity } from '@/lib/services/game-engine';

/**
 * Get single NFT details from OpenSea
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contract');
    const tokenId = searchParams.get('tokenId');

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { success: false, error: 'Contract address and tokenId are required' },
        { status: 400 }
      );
    }

    const nft = await getNFTDetails(contractAddress, tokenId);
    const traits = nft.traits || [];
    const rarity = determineNFTRarity(nft.identifier, traits);

    return NextResponse.json({
      success: true,
      nft: {
        tokenId: nft.identifier,
        contractAddress: nft.contract,
        metadata: {
          name: nft.name || `#${nft.identifier}`,
          image: nft.image_url || nft.display_image_url || '',
          description: nft.description || '',
          attributes: traits,
        },
        owner: nft.owners?.[0]?.address || null,
        rarity,
      },
    });
  } catch (error: any) {
    console.error('Error fetching NFT details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch NFT details',
      },
      { status: 500 }
    );
  }
}
