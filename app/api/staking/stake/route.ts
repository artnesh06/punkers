import { NextRequest, NextResponse } from 'next/server';
import { stakeNFT } from '@/lib/services/staking-service';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import { isGameLocked } from '@/lib/services/game-session-service';

/**
 * POST /api/staking/stake
 * Stakes a single NFT. For bulk staking, use /api/staking/stake-all.
 */
export async function POST(request: NextRequest) {
  try {
    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const body = await request.json();
    const { address, tokenId } = body;

    if (!address || !tokenId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: address and tokenId' },
        { status: 400 }
      );
    }

    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    if (typeof tokenId !== 'string' || tokenId.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Invalid tokenId' },
        { status: 400 }
      );
    }

    const result = await stakeNFT(address, tokenId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Failed to stake NFT' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      staker: result.staker
        ? {
            id: result.staker.id,
            tokenId: result.staker.tokenId,
            isStaked: result.staker.isStaked,
            stakedAt: result.staker.stakedAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error in stake endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
