import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();

    // Auto-create user if not exists, then fetch with stats
    const user = await prisma.mst_users.upsert({
      where: { address: walletAddress },
      update: {},
      create: {
        address: walletAddress,
        points: 0,
      },
      include: {
        stakers: true,
      },
    });

    // Aggregate audits, executions, total points
    const auditsMade = await prisma.auditLog.count({
      where: { 
        actorId: user.id,
        action: 'AUDIT'
      },
    });

    const executionsMade = await prisma.auditLog.count({
      where: { 
        actorId: user.id, 
        action: 'EXECUTE' 
      },
    });

    const totalDead = user.stakers.filter(s => s.isDead).length;
    const totalAlive = user.stakers.filter(s => !s.isDead).length;

    // Calculate level title (using simplified rules from the HTML)
    // 10+ days = Elite, 30+ days = Veteran...
    // I will mock this for now, determining level by total max days survived by best NFT
    const maxDays = user.stakers.length > 0 ? 
      Math.max(...user.stakers.map(s => 
        s.stakedAt ? Math.floor((Date.now() - new Date(s.stakedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
      )) : 0;
    
    let title = 'SURVIVOR';
    if (maxDays >= 90) title = 'LEGEND';
    else if (maxDays >= 30) title = 'VETERAN';
    else if (maxDays >= 10) title = 'ELITE';

    return NextResponse.json({
      success: true,
      profile: {
        address: walletAddress,
        balance: user.points,
        nftsOwned: user.stakers.length,
        aliveNFTs: totalAlive,
        deadNFTs: totalDead,
        totalAudits: auditsMade,
        totalExecutions: executionsMade,
        title,
        maxDaysSurvived: maxDays,
        discord: user.discord,
        discordUsername: user.discordUsername,
        twitter: user.twitter,
        twitterUsername: user.twitterUsername,
      }
    });

  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
