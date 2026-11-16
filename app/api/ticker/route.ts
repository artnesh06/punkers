import { NextResponse } from 'next/server';
import { getTickerAds } from '@/lib/services/ads-service';

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export async function GET() {
  try {
    const ads = await getTickerAds();

    const items = ads.map(ad => ({
      message: ad.message,
      by: shortenAddress(ad.user.address),
      date: ad.startDate.toISOString(),
      slot: ad.id,
      duration: `${ad.durationHours}h`,
      status: 'LIVE',
    }));

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error fetching ticker content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticker content', items: [] },
      { status: 500 }
    );
  }
}
