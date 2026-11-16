import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateSessionToken } from '@/lib/utils/session-token';
import { validateNonce } from '@/lib/utils/nonce-manager';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

/**
 * GET /api/certificate/sync
 * Get certificate data for a user (public read)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: { certificate: true },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Return certificate data or null if doesn't exist
    return NextResponse.json({
      success: true,
      data: user.certificate || null,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificate data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificate/sync
 * Sync certificate data from localStorage to database
 * REQUIRES SESSION TOKEN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, totalXp, nonce } = body;

    // Validation
    if (!sessionToken || totalXp === undefined || !nonce) {
      return NextResponse.json(
        { error: 'Session token, totalXp, and nonce are required' },
        { status: 400 }
      );
    }

    // Validate session token
    const session = await validateSessionToken(sessionToken);
    if (!session.valid) {
      return NextResponse.json(
        { error: session.error || 'Invalid session' },
        { status: 401 }
      );
    }

    const address = session.address!;

    // Validate totalXp is a number
    if (typeof totalXp !== 'number' || totalXp < 0 || !Number.isInteger(totalXp)) {
      return NextResponse.json(
        { error: 'Invalid XP value' },
        { status: 400 }
      );
    }

    // Check rate limit (max 100 sync requests per day per address)
    const rateLimit = checkRateLimit(`sync:${address}`, 100, 24 * 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Validate nonce (prevent replay attacks)
    if (!validateNonce(nonce)) {
      return NextResponse.json(
        { error: 'Invalid or already used nonce' },
        { status: 401 }
      );
    }

    // Additional validation: Check if XP is reasonable
    const existingUser = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: { certificate: true },
    });

    if (existingUser?.certificate) {
      // Certificate already exists, only allow if new XP is higher
      if (totalXp <= existingUser.certificate.totalXp) {
        return NextResponse.json(
          { error: 'Cannot sync lower XP than existing data' },
          { status: 400 }
        );
      }
      
      // Check if XP jump is reasonable (max +100 from last sync)
      const xpDiff = totalXp - existingUser.certificate.totalXp;
      if (xpDiff > 100) {
        return NextResponse.json(
          { error: 'XP increase too large. Please sync more frequently.' },
          { status: 400 }
        );
      }
    }

    // Validate XP is not absurdly high (max 10000 for safety)
    if (totalXp > 10000) {
      return NextResponse.json(
        { error: 'XP value too high' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.mst_users.create({
        data: {
          address: address.toLowerCase(),
        },
      });
    }

    // Calculate level from XP
    const level = calculateLevel(totalXp);

    // Upsert certificate data
    const certificate = await prisma.mst_certificate.upsert({
      where: { userId: user.id },
      update: {
        totalXp,
        level,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        totalXp,
        level,
      },
    });

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error syncing certificate:', error);
    return NextResponse.json(
      { error: 'Failed to sync certificate data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/certificate/sync
 * Add XP to certificate (when user taps)
 * REQUIRES SESSION TOKEN
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, nonce } = body;

    // Validation
    if (!sessionToken || !nonce) {
      return NextResponse.json(
        { error: 'Session token and nonce are required' },
        { status: 400 }
      );
    }

    // Validate session token
    const session = await validateSessionToken(sessionToken);
    if (!session.valid) {
      return NextResponse.json(
        { error: session.error || 'Invalid session' },
        { status: 401 }
      );
    }

    const address = session.address!;

    // SECURITY: XP is ALWAYS 1 per tap (hardcoded in backend, not from request)
    const xpToAdd = 1;

    // Check rate limit (max 10000 taps per minute per address - unlimited brutal tapping!)
    const rateLimit = checkRateLimit(`tap:${address}`, 10000, 60000);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Please wait ${waitSeconds} seconds.`,
          resetAt: rateLimit.resetAt,
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      );
    }

    // Validate nonce (prevent replay attacks)
    if (!validateNonce(nonce)) {
      return NextResponse.json(
        { error: 'Invalid or already used nonce' },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await prisma.mst_users.findUnique({
      where: { address: address.toLowerCase() },
      include: { certificate: true },
    });

    if (!user) {
      user = await prisma.mst_users.create({
        data: {
          address: address.toLowerCase(),
        },
        include: { certificate: true },
      });
    }

    let certificate;
    
    if (user.certificate) {
      // Update existing certificate
      const newTotalXp = user.certificate.totalXp + xpToAdd;
      
      // Sanity check: prevent overflow
      if (newTotalXp > 1000000) {
        return NextResponse.json(
          { error: 'Maximum XP reached' },
          { status: 400 }
        );
      }
      
      const newLevel = calculateLevel(newTotalXp);
      
      certificate = await prisma.mst_certificate.update({
        where: { userId: user.id },
        data: {
          totalXp: newTotalXp,
          level: newLevel,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new certificate
      const newLevel = calculateLevel(xpToAdd);
      
      certificate = await prisma.mst_certificate.create({
        data: {
          userId: user.id,
          totalXp: xpToAdd,
          level: newLevel,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    return NextResponse.json(
      { error: 'Failed to add XP' },
      { status: 500 }
    );
  }
}

// Helper function to calculate level from XP
function calculateLevel(totalXp: number): number {
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
      return i;
    }
    xpLeft -= needed;
  }
  
  // Max level (10+) - allow infinite leveling
  const maxLvIdx = CERT_LEVELS.length - 1;
  const extraLevels = Math.floor(xpLeft / CERT_LEVELS[maxLvIdx].xp);
  return maxLvIdx + extraLevels;
}
