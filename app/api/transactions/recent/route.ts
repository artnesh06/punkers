import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  truncateAddress,
  formatTimeAgo,
  getTransactionIcon,
  getTransactionColor,
  buildDescription,
} from '@/lib/utils/transactions';

const GAME_TYPES = [
  'EARNING_CLAIM',
  'TAX_PAYMENT',
  'SLOT_BET',
  'SLOT_WIN',
  'LOOT_OPEN',
  'LOOT_WIN',
  'EXECUTION_BOUNTY',
  'AUDIT_BOUNTY',
  'penalty',
  'AUDIT_PENALTY',
  'EXECUTION_FORFEIT',
] as const;

/**
 * GET /api/transactions/recent?page=1&limit=10
 * Returns paginated recent transactions.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where = { type: { in: [...GAME_TYPES] } };

    const [rows, total] = await Promise.all([
      prisma.trn_point.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        where,
        include: { user: { select: { address: true } } },
      }),
      prisma.trn_point.count({ where }),
    ]);

    const transactions = rows.map((row) => {
      const userAddress = truncateAddress(row.user?.address ?? '');
      return {
        id: row.id,
        type: row.type,
        points: row.points,
        description: buildDescription(
          { description: row.description, type: row.type },
          userAddress
        ),
        userAddress,
        icon: getTransactionIcon(row.type),
        color: getTransactionColor(row.type),
        timeAgo: formatTimeAgo(row.createdAt),
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalEntries: total,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Failed to fetch recent transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent transactions' },
      { status: 500 }
    );
  }
}
