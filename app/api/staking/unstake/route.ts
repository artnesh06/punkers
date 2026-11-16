import { NextResponse } from 'next/server';

/**
 * POST /api/staking/unstake
 * DISABLED — Per game rules, unstaking is not allowed.
 * "Once you stake, there is no unstake button. You're in the game until you survive or die."
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Unstaking is not allowed. Once you stake, you\'re in until you survive or die. The only way out is death — or the game ending with you as a survivor.',
    },
    { status: 403 }
  );
}
