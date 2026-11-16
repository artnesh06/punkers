import { NextRequest, NextResponse } from 'next/server';
import { getGracePeriodNFTs } from '@/lib/jobs/grace-period-job';

/**
 * GET /api/admin/jobs
 * Get current game status — overdue NFTs that can be audited/executed.
 * 
 * No background jobs needed. All status is calculated on-demand:
 * - Tax status: based on lastTaxPayment timestamp vs now
 * - Audit/Execute eligibility: based on hours overdue
 * - Earnings: calculated from personal stake day + rarity
 * 
 * Tax payment is MANUAL (user clicks "Pay Tax").
 * Audit/Execute is MANUAL (bounty hunters click "Audit" or "Execute").
 */
export async function GET() {
  try {
    const gracePeriodData = await getGracePeriodNFTs();

    return NextResponse.json({
      success: true,
      data: {
        auditable: gracePeriodData.audited.length,
        executable: gracePeriodData.executable.length,
        targets: {
          audited: gracePeriodData.audited,
          executable: gracePeriodData.executable,
        },
      },
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Failed to get game status' },
      { status: 500 }
    );
  }
}
