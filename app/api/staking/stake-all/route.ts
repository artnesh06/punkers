import { NextRequest, NextResponse } from 'next/server';
import { stakeNFT } from '@/lib/services/staking-service';
import { isValidEthereumAddress } from '@/lib/utils/validation';
import { isGameLocked } from '@/lib/services/game-session-service';

/**
 * POST /api/staking/stake-all
 * Stakes all provided NFT tokenIds at once.
 * Used for "ENTER GAME" — one-click registration as participant.
 * Body: { address: string, tokenIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const locked = await isGameLocked();
    if (locked) {
      return NextResponse.json({ error: 'Game has ended' }, { status: 403 });
    }

    const body = await request.json();
    const { address, tokenIds } = body;

    if (!address || !tokenIds || !Array.isArray(tokenIds) || tokenIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: address and tokenIds (array)' },
        { status: 400 }
      );
    }

    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    const results: { tokenId: string; success: boolean; message?: string }[] = [];
    let successCount = 0;
    let failCount = 0;

    // Stake each NFT sequentially
    for (const tokenId of tokenIds) {
      if (typeof tokenId !== 'string' || tokenId.trim() === '') {
        results.push({ tokenId, success: false, message: 'Invalid tokenId' });
        failCount++;
        continue;
      }

      const result = await stakeNFT(address, tokenId);
      results.push({
        tokenId,
        success: result.success,
        message: result.message,
      });

      if (result.success) successCount++;
      else failCount++;
    }

    const response = {
      success: successCount > 0,
      message: `Staked ${successCount} NFT(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
      summary: { total: tokenIds.length, staked: successCount, failed: failCount },
    };

    return NextResponse.json(response, {
      status: successCount > 0 ? 200 : 400,
    });
  } catch (error) {
    console.error('Error in stake-all endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
