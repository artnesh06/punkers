import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Calculate treasury balance from all tax payments and penalties
    const taxPayments = await prisma.trn_point.aggregate({
      where: {
        type: 'TAX_PAYMENT',
      },
      _sum: {
        points: true,
      },
    });

    const auditPenalties = await prisma.trn_point.aggregate({
      where: {
        type: 'AUDIT_PENALTY',
      },
      _sum: {
        points: true,
      },
    });

    const forfeitedEarnings = await prisma.trn_point.aggregate({
      where: {
        type: 'EXECUTION_FORFEIT',
      },
      _sum: {
        points: true,
      },
    });

    // Calculate total bounties paid out
    const bountyPayouts = await prisma.trn_point.aggregate({
      where: {
        type: {
          in: ['AUDIT_BOUNTY', 'EXECUTION_BOUNTY'],
        },
      },
      _sum: {
        points: true,
      },
    });

    const totalCollected = Math.abs(taxPayments._sum.points || 0) + 
                          Math.abs(auditPenalties._sum.points || 0) + 
                          Math.abs(forfeitedEarnings._sum.points || 0);
    
    // Bounties are minted separately as player incentives — they do NOT reduce the treasury.
    // Treasury only accumulates from taxes, penalties, and forfeited earnings.
    const totalBountyMinted = bountyPayouts._sum.points || 0;
    const currentBalance = totalCollected;

    // Get recent treasury transactions
    const recentTransactions = await prisma.trn_point.findMany({
      where: {
        type: {
          in: ['TAX_PAYMENT', 'AUDIT_PENALTY', 'EXECUTION_FORFEIT', 'AUDIT_BOUNTY', 'EXECUTION_BOUNTY'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        user: {
          select: {
            address: true,
          },
        },
      },
    });

    const transactions = recentTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.points,
      description: tx.description,
      userAddress: tx.user.address,
      timestamp: tx.createdAt,
    }));

    // Calculate pending rewards (for final 500 survivors)
    const survivorsCount = await prisma.mst_staker.count({
      where: {
        isStaked: true,
        isDead: false,
      },
    });

    const pendingRewards = survivorsCount <= 500 ? currentBalance : 0;

    return NextResponse.json({
      success: true,
      balance: currentBalance.toString(),
      totalCollected: totalCollected.toString(),
      totalBountyMinted: totalBountyMinted.toString(),
      pendingRewards: pendingRewards.toString(),
      transactions,
      stats: {
        totalTaxPayments: Math.abs(taxPayments._sum.points || 0),
        totalPenalties: Math.abs(auditPenalties._sum.points || 0),
        totalForfeited: Math.abs(forfeitedEarnings._sum.points || 0),
        totalBounties: totalBountyMinted,
        survivorsRemaining: survivorsCount,
      },
    });
  } catch (error) {
    console.error('Error getting treasury data:', error);
    return NextResponse.json(
      { error: 'Failed to get treasury data' },
      { status: 500 }
    );
  }
}