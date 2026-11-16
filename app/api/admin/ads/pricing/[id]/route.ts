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
    const body = await request.json();
    const { name, durationHours, price, isActive, sortOrder } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (durationHours !== undefined) data.durationHours = Number(durationHours);
    if (price !== undefined) data.price = Number(price);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const pkg = await prisma.ads_pricing.update({ where: { id }, data });

    await prisma.auditLog.create({
      data: { action: 'UPDATE_PRICING', targetId: id, metadata: data },
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
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
    await prisma.ads_pricing.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { action: 'DELETE_PRICING', targetId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json({ error: 'Failed to delete pricing' }, { status: 500 });
  }
}
