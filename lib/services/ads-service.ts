import { prisma } from '@/lib/prisma';

/**
 * Get active pricing packages for public display.
 */
export async function getActivePricingPackages() {
  return prisma.ads_pricing.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get all pricing packages (admin).
 */
export async function getAllPricingPackages() {
  return prisma.ads_pricing.findMany({
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Get all ads for a user.
 */
export async function getUserAds(userId: string) {
  // Lazy-expire ads that are past their expireDate
  await prisma.mst_ads.updateMany({
    where: { userId, status: 'ACTIVE', expireDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  return prisma.mst_ads.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new ad. Deducts $PUNK from user balance in a transaction.
 */
export async function createAd(userId: string, message: string, pricingId: string) {
  const pricing = await prisma.ads_pricing.findUnique({ where: { id: pricingId } });
  if (!pricing || !pricing.isActive) {
    throw new Error('Invalid or inactive pricing package');
  }

  const user = await prisma.mst_users.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.points < pricing.price) {
    throw new Error(`Insufficient $PUNK balance. Required: ${pricing.price}, Available: ${user.points}`);
  }

  if (!message || message.trim().length === 0 || message.length > 100) {
    throw new Error('Message must be 1-100 characters');
  }

  const now = new Date();
  const expireDate = new Date(now.getTime() + pricing.durationHours * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    // Re-check balance inside transaction to prevent race condition
    const userInTx = await tx.mst_users.findUnique({ where: { id: userId } });
    if (!userInTx || userInTx.points < pricing.price) {
      throw new Error(`Insufficient $PUNK balance. Required: ${pricing.price}`);
    }

    const ad = await tx.mst_ads.create({
      data: {
        userId,
        message: message.trim(),
        status: 'ACTIVE',
        cost: pricing.price,
        durationHours: pricing.durationHours,
        startDate: now,
        expireDate,
      },
    });

    await tx.trn_point.create({
      data: {
        userId,
        points: -pricing.price,
        description: `Ad purchase: "${message.trim().slice(0, 50)}" — ${pricing.name} (${pricing.durationHours}h)`,
        type: 'AD_PURCHASE',
      },
    });

    await tx.mst_users.update({
      where: { id: userId },
      data: { points: { decrement: pricing.price } },
    });

    return ad;
  });
}

/**
 * Edit an ad message (user's own ad, only if not expired).
 */
export async function editAd(adId: string, userId: string, message: string) {
  const ad = await prisma.mst_ads.findUnique({ where: { id: adId } });
  if (!ad || ad.userId !== userId) {
    throw new Error('Ad not found or not owned by you');
  }

  if (ad.status === 'EXPIRED') {
    throw new Error('Cannot edit an expired ad');
  }

  if (ad.expireDate < new Date()) {
    await prisma.mst_ads.update({ where: { id: adId }, data: { status: 'EXPIRED' } });
    throw new Error('Ad has expired');
  }

  if (!message || message.trim().length === 0 || message.length > 100) {
    throw new Error('Message must be 1-100 characters');
  }

  return prisma.mst_ads.update({
    where: { id: adId },
    data: { message: message.trim() },
  });
}

/**
 * Toggle ad status between ACTIVE and PAUSED (user's own ad).
 */
export async function toggleAd(adId: string, userId: string) {
  const ad = await prisma.mst_ads.findUnique({ where: { id: adId } });
  if (!ad || ad.userId !== userId) {
    throw new Error('Ad not found or not owned by you');
  }

  if (ad.status === 'EXPIRED') {
    throw new Error('Cannot toggle an expired ad');
  }

  // Check if ad has expired
  if (ad.expireDate < new Date()) {
    await prisma.mst_ads.update({ where: { id: adId }, data: { status: 'EXPIRED' } });
    throw new Error('Ad has expired');
  }

  const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  return prisma.mst_ads.update({
    where: { id: adId },
    data: { status: newStatus },
  });
}

/**
 * Get active ads for the ticker. Lazy-expires stale ads first.
 */
export async function getTickerAds() {
  // Lazy expire all stale ads
  await prisma.mst_ads.updateMany({
    where: { status: 'ACTIVE', expireDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  return prisma.mst_ads.findMany({
    where: {
      status: 'ACTIVE',
      isVisible: true,
      expireDate: { gt: new Date() },
    },
    include: { user: { select: { address: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all ads with user info (admin).
 */
export async function getAllAdsAdmin() {
  // Lazy expire
  await prisma.mst_ads.updateMany({
    where: { status: 'ACTIVE', expireDate: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  const [ads, stats] = await Promise.all([
    prisma.mst_ads.findMany({
      include: { user: { select: { address: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mst_ads.aggregate({
      _count: { id: true },
      _sum: { cost: true },
    }),
  ]);

  const activeCount = ads.filter(a => a.status === 'ACTIVE').length;

  return {
    ads,
    stats: {
      total: stats._count.id,
      active: activeCount,
      revenue: stats._sum.cost || 0,
    },
  };
}
