import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Lazy expire stale ads
    await prisma.mst_ads.updateMany({
      where: { status: 'ACTIVE', expireDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });

    const ads = await prisma.mst_ads.findMany({
      where: {
        status: 'ACTIVE',
        isVisible: true,
        expireDate: { gt: new Date() },
      },
      include: { user: { select: { address: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const now = Date.now();
    const adsWithRemaining = ads.map(ad => ({
      id: ad.id,
      message: ad.message,
      status: ad.status,
      by: ad.user?.address
        ? `${ad.user.address.slice(0, 6)}...${ad.user.address.slice(-4)}`
        : 'Anonymous',
      date: ad.startDate.toISOString(),
      duration: `${ad.durationHours}h`,
      remainingMs: Math.max(0, ad.expireDate.getTime() - now),
    }));

    return NextResponse.json({ success: true, ads: adsWithRemaining });
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ads' }, { status: 500 });
  }
}
