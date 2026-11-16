import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateSlotResult,
  BET_AMOUNTS,
  type BetAmount,
} from '@/lib/services/slot-machine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { betAmount, address } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 401 });
    }

    const walletAddress = address.toLowerCase();

    // Validate bet amount
    if (!BET_AMOUNTS.includes(betAmount)) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

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

    // Check if user has enough balance
    if (currentBalance < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance', balance: currentBalance },
        { status: 400 }
      );
    }

    // Get spins since last win for guaranteed win mechanic
    const recentSpins = await prisma.trn_slot_spin.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let spinsSinceLast = 0;
    for (const spin of recentSpins) {
      if (spin.payout > 0) break;
      spinsSinceLast++;
    }

    // Generate slot result
    const result = generateSlotResult(betAmount as BetAmount, spinsSinceLast);

    // Create transaction in database
    await prisma.$transaction(async (tx) => {
      // Deduct bet amount
      await tx.trn_point.create({
        data: {
          userId: user.id,
          points: -betAmount,
          type: 'SLOT_BET',
          description: `Slot machine bet: ${betAmount} $PUNK`,
        },
      });

      // Add payout if won
      if (result.payout > 0) {
        await tx.trn_point.create({
          data: {
            userId: user.id,
            points: result.payout,
            type: 'SLOT_WIN',
            description: `Slot machine win: ${result.resultText}`,
          },
        });
      }

      // Record spin
      await tx.trn_slot_spin.create({
        data: {
          userId: user.id,
          betAmount,
          symbols: result.symbols.join(','),
          payout: result.payout,
          resultType: result.resultType,
        },
      });
    });

    // Calculate new balance
    const newBalance = currentBalance - betAmount + result.payout;

    return NextResponse.json({
      success: true,
      result: {
        symbols: result.symbols,
        payout: result.payout,
        resultType: result.resultType,
        resultText: result.resultText,
        matchCount: result.matchCount,
        matchSymbol: result.matchSymbol,
      },
      balance: newBalance,
      netChange: result.payout - betAmount,
    });
  } catch (error) {
    console.error('Slot spin error:', error);
    return NextResponse.json(
      { error: 'Failed to process spin' },
      { status: 500 }
    );
  }
}
