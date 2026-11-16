import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/disconnect
 * Disconnect a social account (discord or twitter) from wallet
 */
export async function POST(request: NextRequest) {
  try {
    const { address, provider } = await request.json();

    if (!address || !provider) {
      return NextResponse.json(
        { success: false, error: 'Address and provider are required' },
        { status: 400 }
      );
    }

    if (!['discord', 'twitter'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Invalid provider. Use "discord" or "twitter"' },
        { status: 400 }
      );
    }

    const walletAddress = address.toLowerCase();

    const user = await prisma.mst_users.findUnique({
      where: { address: walletAddress },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updateData =
      provider === 'discord'
        ? { discord: null, discordUsername: null }
        : { twitter: null, twitterUsername: null };

    await prisma.mst_users.update({
      where: { address: walletAddress },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
