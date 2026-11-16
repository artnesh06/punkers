import { NextRequest, NextResponse } from 'next/server';
import { getStakedNFTs } from '@/lib/services/staking-service';

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

    const stakedNFTs = await getStakedNFTs(address);

    return NextResponse.json({
      success: true,
      stakedNFTs,
      count: stakedNFTs.length,
    });
  } catch (error) {
    console.error('Error fetching staking status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch staking status',
        stakedNFTs: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
