import { prisma } from '@/lib/prisma';

export interface Certificate {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get certificate by user address
 */
export async function getCertificateByAddress(
  address: string
): Promise<Certificate | null> {
  try {
    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: { certificate: true },
    });

    if (!user) {
      return null;
    }

    return user.certificate;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw error;
  }
}

/**
 * Create or update certificate for a user
 * This is used for syncing localStorage data to database
 */
export async function upsertCertificate(
  address: string,
  totalXp: number
): Promise<Certificate> {
  try {
    // First, ensure user exists
    let user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.mst_users.create({
        data: { address: address.toLowerCase() },
      });
    }

    // Calculate level from XP
    const level = calculateLevelFromXp(totalXp);

    // Upsert certificate
    const certificate = await prisma.mst_certificate.upsert({
      where: { userId: user.id },
      update: {
        totalXp,
        level,
      },
      create: {
        userId: user.id,
        totalXp,
        level,
      },
    });

    return certificate;
  } catch (error) {
    console.error('Error upserting certificate:', error);
    throw error;
  }
}

/**
 * Add XP to user's certificate
 */
export async function addCertificateXp(
  address: string,
  xpToAdd: number = 1
): Promise<Certificate> {
  try {
    // Ensure user exists
    let user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: { certificate: true },
    });

    if (!user) {
      user = await prisma.mst_users.create({
        data: { address: address.toLowerCase() },
        include: { certificate: true },
      });
    }

    const currentXp = user.certificate?.totalXp || 0;
    const newTotalXp = currentXp + xpToAdd;
    const newLevel = calculateLevelFromXp(newTotalXp);

    // Upsert certificate
    const certificate = await prisma.mst_certificate.upsert({
      where: { userId: user.id },
      update: {
        totalXp: newTotalXp,
        level: newLevel,
      },
      create: {
        userId: user.id,
        totalXp: newTotalXp,
        level: newLevel,
      },
    });

    return certificate;
  } catch (error) {
    console.error('Error adding certificate XP:', error);
    throw error;
  }
}

/**
 * Calculate level from total XP
 * Matches the CERT_LEVELS logic from CertificateModal
 */
function calculateLevelFromXp(totalXp: number): number {
  const CERT_LEVELS = [
    { lv: 1, xp: 10 },
    { lv: 2, xp: 20 },
    { lv: 3, xp: 35 },
    { lv: 4, xp: 55 },
    { lv: 5, xp: 80 },
    { lv: 6, xp: 110 },
    { lv: 7, xp: 150 },
    { lv: 8, xp: 200 },
    { lv: 9, xp: 260 },
    { lv: 10, xp: 999 },
  ];

  let xpLeft = totalXp;
  
  for (let i = 0; i < CERT_LEVELS.length - 1; i++) {
    const needed = CERT_LEVELS[i].xp;
    if (xpLeft < needed) {
      return i; // Return level index (0-based)
    }
    xpLeft -= needed;
  }

  // Max level (10+) - allow infinite leveling
  const maxLvIdx = CERT_LEVELS.length - 1;
  const extraLevels = Math.floor(xpLeft / CERT_LEVELS[maxLvIdx].xp);
  return maxLvIdx + extraLevels;
}
