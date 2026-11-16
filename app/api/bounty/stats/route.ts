import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAddress } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!validateAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        totalBounties: 0,
        totalEarned: 0,
        audits: 0,
        executions: 0,
      });
    }

    // Count bounty actions from audit log
    const auditActions = await prisma.auditLog.count({
      where: {
        actorId: user.id,
        action: 'AUDIT',
      },
    });

    const executeActions = await prisma.auditLog.count({
      where: {
        actorId: user.id,
        action: 'EXECUTE',
      },
    });

    // Calculate total bounty earnings from transaction history
    const bountyEarnings = await prisma.trn_point.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ['AUDIT_BOUNTY', 'EXECUTION_BOUNTY'],
        },
      },
      _sum: {
        points: true,
      },
    });

    const totalBounties = auditActions + executeActions;
    const totalEarned = bountyEarnings._sum.points || 0;

    return NextResponse.json({
      success: true,
      totalBounties,
      totalEarned,
      audits: auditActions,
      executions: executeActions,
    });
  } catch (error) {
    console.error('Error getting bounty stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}