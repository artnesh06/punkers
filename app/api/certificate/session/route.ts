import { NextRequest, NextResponse } from 'next/server';
import { verifyWalletSignature, generateSessionMessage, isTimestampValid } from '@/lib/utils/wallet-verification';
import { generateSessionToken } from '@/lib/utils/session-token';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

/**
 * POST /api/certificate/session
 * Create a new session token after wallet signature verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, timestamp } = body;

    // Validation
    if (!address || !signature || !timestamp) {
      return NextResponse.json(
        { error: 'Address, signature, and timestamp are required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Check rate limit (max 100 session creations per day per address)
    const rateLimit = checkRateLimit(`session:${address.toLowerCase()}`, 100, 24 * 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many session requests. Please try again later.',
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Verify timestamp is recent (within 1 hour)
    if (!isTimestampValid(timestamp)) {
      return NextResponse.json(
        { error: 'Timestamp expired or invalid' },
        { status: 401 }
      );
    }

    // Verify signature
    const message = generateSessionMessage(address, timestamp);
    const isValid = await verifyWalletSignature(address, message, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = await generateSessionToken(address);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt,
      message: 'Session created successfully',
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
