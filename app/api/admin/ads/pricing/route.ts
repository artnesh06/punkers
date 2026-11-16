import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const packages = await prisma.ads_pricing.findMany({ orderBy: { sortOrder: 'asc' } });
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, durationHours, price, isActive, sortOrder } = body;

    if (!name || !durationHours || !price) {
      return NextResponse.json({ error: 'name, durationHours, and price are required' }, { status: 400 });
    }

    const pkg = await prisma.ads_pricing.create({
      data: { name, durationHours: Number(durationHours), price: Number(price), isActive: isActive !== false, sortOrder: Number(sortOrder || 0) },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE_PRICING', metadata: { pricingId: pkg.id, name, price } },
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error creating pricing:', error);
    return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 });
  }
}
