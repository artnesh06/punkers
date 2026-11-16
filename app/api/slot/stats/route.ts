import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');
    if (!addressParam) {
      return NextResponse.json({ error: 'Address is required' }, { status: 401 });
    }

    const walletAddress = addressParam.toLowerCase();

    // Get user
    const user = await prisma.mst_users.findUnique({
      where: { address: walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current balance
    const pointsSum = await prisma.trn_point.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });
    const balance = pointsSum._sum.points || 0;

    // Get slot statistics
    const spins = await prisma.trn_slot_spin.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const totalSpins = spins.length;
    const totalWins = spins.filter((s) => s.payout > 0).length;
    const biggestWin = Math.max(...spins.map((s) => s.payout), 0);
    const totalWagered = spins.reduce((sum, s) => sum + s.betAmount, 0);
    const totalWon = spins.reduce((sum, s) => sum + s.payout, 0);
    const netProfit = totalWon - totalWagered;

    // Recent spins (last 10)
    const recentSpins = spins.slice(0, 10).map((spin) => ({
      id: spin.id,
      betAmount: spin.betAmount,
      symbols: spin.symbols.split(','),
      payout: spin.payout,
      resultType: spin.resultType,
      createdAt: spin.createdAt,
    }));

    return NextResponse.json({
      balance,
      stats: {
        totalSpins,
        totalWins,
        biggestWin,
        totalWagered,
        totalWon,
        netProfit,
        winRate: totalSpins > 0 ? ((totalWins / totalSpins) * 100).toFixed(1) : '0.0',
      },
      recentSpins,
    });
  } catch (error) {
    console.error('Slot stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
