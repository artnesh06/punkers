import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ad = await prisma.mst_ads.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    const updated = await prisma.mst_ads.update({
      where: { id },
      data: { isVisible: !ad.isVisible },
    });

    await prisma.auditLog.create({
      data: {
        action: 'TOGGLE_AD_VISIBILITY',
        targetId: id,
        metadata: { isVisible: updated.isVisible, message: ad.message },
      },
    });

    return NextResponse.json({ success: true, ad: updated });
  } catch (error) {
    console.error('Error toggling ad visibility:', error);
    return NextResponse.json({ error: 'Failed to toggle visibility' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ad = await prisma.mst_ads.findUnique({ where: { id } });
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    await prisma.mst_ads.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_AD',
        targetId: id,
        metadata: { message: ad.message, userId: ad.userId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad:', error);
    return NextResponse.json({ error: 'Failed to delete ad' }, { status: 500 });
  }
}
