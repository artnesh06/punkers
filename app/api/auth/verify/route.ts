import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * POST /api/auth/verify
 * Verify wallet signature and create/update user
 * 
 * This endpoint implements SIWE (Sign-In with Ethereum) pattern:
 * 1. Client signs a message with their wallet
 * 2. Server verifies the signature
 * 3. If valid, create/update user in database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, signature } = body;

    // Validate input
    if (!address || !message || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: address, message, signature',
        },
        { status: 400 }
      );
    }

    // Verify the signature
    let isValid: boolean;
    try {
      isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
    } catch (verifyError) {
      console.error('Signature verification threw:', verifyError);
      return NextResponse.json(
        {
          success: false,
          error: 'Signature verification failed',
          details: verifyError instanceof Error ? verifyError.message : 'Unknown verification error',
        },
        { status: 400 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signature',
        },
        { status: 401 }
      );
    }

    // Signature is valid, create or update user
    try {
      const user = await prisma.mst_users.upsert({
        where: { address: address.toLowerCase() },
        update: {
          updatedAt: new Date(),
        },
        create: {
          address: address.toLowerCase(),
          points: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          address: user.address,
          points: user.points,
        },
      });
    } catch (dbError) {
      console.error('Database error during user upsert:', dbError);
      
      // Return success anyway if signature is valid (fallback for DB issues)
      return NextResponse.json({
        success: true,
        message: 'Authentication successful (DB unavailable)',
        user: {
          id: 0,
          address: address.toLowerCase(),
          points: 0,
        },
        warning: 'Database connection issue - user data not persisted',
      });
    }
  } catch (error) {
    console.error('Error in auth/verify:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
