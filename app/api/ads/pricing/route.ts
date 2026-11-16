import { NextResponse } from 'next/server';
import { getActivePricingPackages } from '@/lib/services/ads-service';

export async function GET() {
  try {
    const packages = await getActivePricingPackages();
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 });
  }
}
