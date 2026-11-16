import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/nonce
 * Generate a nonce message for wallet signature
 * 
 * This message will be signed by the user's wallet to prove ownership
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address parameter is required',
        },
        { status: 400 }
      );
    }

    // Generate a unique nonce (timestamp-based)
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);

    // Create SIWE-like message
    const message = `Welcome to Punkers Survival!

Sign this message to authenticate your wallet.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;

    return NextResponse.json({
      success: true,
      message,
      nonce,
      timestamp,
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate nonce',
      },
      { status: 500 }
    );
  }
}
