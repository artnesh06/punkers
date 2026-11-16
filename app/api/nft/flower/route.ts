import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

/**
 * POST /api/nft/flower
 * Give 1 flower to a dead NFT. No count param — 1 request = 1 flower.
 * Source of truth = trn_flower table. flowerCount computed via COUNT().
 * Body: { tokenId: string, address: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { tokenId, address } = await request.json();

    if (!tokenId || !address) {
      return NextResponse.json(
        { success: false, error: 'tokenId and address are required' },
        { status: 400 },
      );
    }

    const giverAddress = address.toLowerCase();

    // Rate limit: 200/min per address+IP
    const rateKey = `flower:${giverAddress}:${ip}`;
    if (!checkRateLimit(rateKey, 200, 60000).allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests.' },
        { status: 429 },
      );
    }

    // 1 insert = 1 flower. Done. Fast.
    await prisma.trn_flower.create({
      data: { tokenId, giverAddress },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error giving flower:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to give flower' },
      { status: 500 },
    );
  }
}
