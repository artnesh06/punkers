import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LOOT_CHESTS } from '@/lib/services/loot-chest';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();

    const user = await prisma.mst_users.findUnique({
      where: { address: walletAddress },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get balance
    const pointsSum = await prisma.trn_point.aggregate({
      where: { userId: user.id },
      _sum: { points: true },
    });
    const balance = pointsSum._sum.points || 0;

    // Get loot stats
    const lootOpens = await prisma.trn_loot_open.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const totalOpened = lootOpens.length;
    const totalEarned = lootOpens.reduce((s, l) => s + l.payout, 0);
    const totalSpent = lootOpens.reduce((s, l) => s + l.cost, 0);
    const bestWin = lootOpens.length > 0 ? Math.max(...lootOpens.map((l) => l.payout)) : 0;

    // Recent history (last 30)
    const recentHistory = lootOpens.slice(0, 30).map((l) => ({
      id: l.id,
      chestType: l.chestType,
      cost: l.cost,
      lootEmoji: l.lootEmoji,
      lootName: l.lootName,
      lootRarity: l.lootRarity,
      payout: l.payout,
      createdAt: l.createdAt,
    }));

    return NextResponse.json({
      balance,
      stats: {
        totalOpened,
        totalEarned,
        totalSpent,
        netProfit: totalEarned - totalSpent,
        bestWin,
      },
      recentHistory,
      chests: LOOT_CHESTS,
    });
  } catch (error) {
    console.error('Loot stats error:', error);
    return NextResponse.json({ error: 'Failed to get loot stats' }, { status: 500 });
  }
}
