import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAd } from '@/lib/services/ads-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, pricingId } = body;

    if (!address || !message || !pricingId) {
      return NextResponse.json(
        { success: false, error: 'address, message, and pricingId are required' },
        { status: 400 }
      );
    }

    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const ad = await createAd(user.id, message, pricingId);

    return NextResponse.json({ success: true, ad });
  } catch (error: any) {
    console.error('Error creating ad:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create ad' },
      { status: 400 }
    );
  }
}
