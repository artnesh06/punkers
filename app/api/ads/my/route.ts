import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserAds } from '@/lib/services/ads-service';

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address')?.toLowerCase();
    if (!address) {
      return NextResponse.json({ success: false, error: 'Address required' }, { status: 400 });
    }

    const user = await prisma.mst_users.findUnique({
      where: { address },
      select: { id: true, points: true },
    });

    if (!user) {
      return NextResponse.json({ success: true, ads: [], balance: 0 });
    }

    const ads = await getUserAds(user.id);

    // Add remaining time to each ad
    const now = new Date();
    const adsWithTime = ads.map(ad => ({
      ...ad,
      remainingMs: ad.expireDate > now ? ad.expireDate.getTime() - now.getTime() : 0,
    }));

    return NextResponse.json({ success: true, ads: adsWithTime, balance: user.points });
  } catch (error) {
    console.error('Error fetching user ads:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ads' }, { status: 500 });
  }
}
