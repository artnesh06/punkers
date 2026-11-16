import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGameDay } from '@/lib/services/game-engine';

/**
 * GET /api/stats/global
 * Returns daily stats for the growth chart: revenue, deaths, survivors per day.
 * Computed from trn_point and mst_staker timestamps.
 */
export async function GET() {
  try {
    // Get game start date
    const gameState = await prisma.gameState.findFirst();
    if (!gameState) {
      return NextResponse.json({ success: true, days: [] });
    }

    const startDate = gameState.gameStartDate;
    const currentDay = getGameDay(startDate);
    const maxDays = Math.min(currentDay, 60);

    // Fetch all tax payments with timestamps
    const taxPayments = await prisma.trn_point.findMany({
      where: { type: 'TAX_PAYMENT' },
      select: { points: true, createdAt: true },
    });

    // Fetch all deaths with timestamps
    const deaths = await prisma.mst_staker.findMany({
      where: { isDead: true, deathDate: { not: null } },
      select: { deathDate: true },
    });

    // Fetch total staked count (for computing survivors)
    const totalEverStaked = await prisma.mst_staker.count();

    // Build daily buckets
    const days: {
      day: number;
      date: string;
      revenue: number;
      totalRevenue: number;
      deaths: number;
      totalDeaths: number;
      survivors: number;
    }[] = [];

    let cumulativeRevenue = 0;
    let cumulativeDeaths = 0;

    for (let d = 1; d <= maxDays; d++) {
      const dayStart = new Date(startDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);

      // Revenue for this day (absolute value of tax payments)
      const dayRevenue = taxPayments
        .filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd)
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

      // Deaths for this day
      const dayDeaths = deaths.filter(
        d => d.deathDate && d.deathDate >= dayStart && d.deathDate < dayEnd
      ).length;

      cumulativeRevenue += dayRevenue;
      cumulativeDeaths += dayDeaths;

      days.push({
        day: d,
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue,
        totalRevenue: cumulativeRevenue,
        deaths: dayDeaths,
        totalDeaths: cumulativeDeaths,
        survivors: Math.max(0, totalEverStaked - cumulativeDeaths),
      });
    }

    return NextResponse.json({
      success: true,
      days,
      summary: {
        currentDay: currentDay,
        totalRevenue: cumulativeRevenue,
        totalDeaths: cumulativeDeaths,
        totalSurvivors: totalEverStaked - cumulativeDeaths,
        totalStaked: totalEverStaked,
      },
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
