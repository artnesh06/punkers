import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/middleware/admin-session';
import { getAllAdsAdmin } from '@/lib/services/ads-service';

export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getAllAdsAdmin();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching admin ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
