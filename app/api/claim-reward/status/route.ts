import { NextRequest, NextResponse } from 'next/server';
import { getClaimStatus } from '@/lib/services/claim-reward-service';
import { logError } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/claim-reward/status?address=<0x...>
 *
 * Returns the reward-distribution claim eligibility for a single wallet
 * address. The address is normalized to lowercase before being looked up in
 * `trn_distribution_reward` (Requirement 3.2).
 *
 * Response shapes:
 *  - 200 `{ success: true, eligible: boolean, address, count, rewardAmount,
 *          isClaimed, claimedAt }` (Requirements 3.5, 3.6)
 *  - 400 `{ success: false, error: "Address is required" }` when the query
 *        parameter is missing (Requirement 3.3)
 *  - 400 `{ success: false, error: "Invalid address format" }` when it does
 *        not match the Ethereum address regex (Requirement 3.4)
 *  - 500 `{ success: false, error: "Failed to fetch claim status" }` on any
 *        unexpected database failure (Requirement 3.7)
 */
export async function GET(request: NextRequest) {
  const address = new URL(request.url).searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { success: false, error: 'Address is required' },
      { status: 400 },
    );
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { success: false, error: 'Invalid address format' },
      { status: 400 },
    );
  }

  try {
    const status = await getClaimStatus(address);
    return NextResponse.json(
      { success: true, ...status },
      { status: 200 },
    );
  } catch (err) {
    logError(
      'Failed to fetch claim status',
      err instanceof Error ? err : new Error(String(err)),
      { address: address.toLowerCase() },
    );
    return NextResponse.json(
      { success: false, error: 'Failed to fetch claim status' },
      { status: 500 },
    );
  }
}
