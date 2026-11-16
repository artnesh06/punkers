import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toggleAd } from '@/lib/services/ads-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address required' }, { status: 400 });
    }

    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const ad = await toggleAd(id, user.id);
    return NextResponse.json({ success: true, ad });
  } catch (error: any) {
    console.error('Error toggling ad:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle ad' },
      { status: 400 }
    );
  }
}
