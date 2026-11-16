import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/utils/error-handler';

/**
 * PUT /api/user/pfp
 * Set favorite PFP for user
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, tokenId } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Get or create user
    let user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.mst_users.create({
        data: {
          address: address.toLowerCase(),
          points: 0,
        },
      });
    }

    // Update favorite PFP
    await prisma.mst_users.update({
      where: { address: address.toLowerCase() },
      data: { favoritePfpTokenId: tokenId || null },
    });

    return NextResponse.json({ success: true, tokenId }, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/user/pfp',
      method: 'PUT',
    });
  }
}

/**
 * GET /api/user/pfp?address=0x...
 * Get favorite PFP for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      select: { favoritePfpTokenId: true },
    });

    return NextResponse.json({ 
      tokenId: user?.favoritePfpTokenId || null 
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/user/pfp',
      method: 'GET',
    });
  }
}
