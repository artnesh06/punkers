import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openChest, LOOT_CHESTS, type ChestType } from '@/lib/services/loot-chest';

export async function POST(request: NextRequest) {
  try {
    const { address, chestId } = await request.json();

    if (!address || !chestId) {
      return NextResponse.json({ error: 'Address and chestId are required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();
    const validChestIds = LOOT_CHESTS.map((c) => c.id);
    if (!validChestIds.includes(chestId)) {
      return NextResponse.json({ error: 'Invalid chest type' }, { status: 400 });
    }

    const chest = LOOT_CHESTS.find((c) => c.id === chestId)!;

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
    const currentBalance = pointsSum._sum.points || 0;

    if (currentBalance < chest.cost) {
      return NextResponse.json(
        { error: 'Insufficient balance', balance: currentBalance, required: chest.cost },
        { status: 400 }
      );
    }

    // Roll loot
    const result = openChest(chestId as ChestType);
    if (!result) {
      return NextResponse.json({ error: 'Failed to open chest' }, { status: 500 });
    }

    // Create transactions in database
    await prisma.$transaction(async (tx) => {
      // Deduct chest cost
      await tx.trn_point.create({
        data: {
          userId: user.id,
          points: -chest.cost,
          type: 'LOOT_OPEN',
          description: `Opened ${chest.label} Chest: -${chest.cost} $PUNK`,
        },
      });

      // Add loot payout
      if (result.loot.punk > 0) {
        await tx.trn_point.create({
          data: {
            userId: user.id,
            points: result.loot.punk,
            type: 'LOOT_WIN',
            description: `${chest.label} Chest: ${result.loot.name} +${result.loot.punk} $PUNK`,
          },
        });
      }

      // Record loot open
      await tx.trn_loot_open.create({
        data: {
          userId: user.id,
          chestType: chestId,
          cost: chest.cost,
          lootEmoji: result.loot.emoji,
          lootName: result.loot.name,
          lootRarity: result.loot.rarity,
          payout: result.loot.punk,
        },
      });
    });

    const newBalance = currentBalance - chest.cost + result.loot.punk;

    return NextResponse.json({
      success: true,
      result: {
        chestLabel: result.chestLabel,
        chestCost: result.chestCost,
        loot: result.loot,
      },
      balance: newBalance,
      netChange: result.loot.punk - chest.cost,
    });
  } catch (error) {
    console.error('Loot open error:', error);
    return NextResponse.json({ error: 'Failed to open chest' }, { status: 500 });
  }
}
