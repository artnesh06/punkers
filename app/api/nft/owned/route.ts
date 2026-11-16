import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Get NFTs owned by an address from database
 * This is a fallback when blockchain queries fail
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        stakers: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        nfts: [],
        message: 'User not found in database',
      });
    }

    // Map stakers to NFT format
    const nfts = user.stakers.map((staker) => ({
      tokenId: staker.tokenId,
      contractAddress: staker.collection.contractAddress,
      owner: address,
      isStaked: staker.isStaked,
      isDead: staker.isDead,
      health: staker.health,
      metadata: {
        name: `${staker.collection.name} #${staker.tokenId}`,
        image: '', // You can add image URL logic here
        attributes: [],
      },
    }));

    return NextResponse.json({
      success: true,
      nfts,
      count: nfts.length,
    });
  } catch (error) {
    console.error('Error fetching owned NFTs from database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch NFTs',
        nfts: [],
      },
      { status: 500 }
    );
  }
}
