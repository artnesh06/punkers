import { NextRequest, NextResponse } from 'next/server';
import { addCertificateXp } from '@/lib/services/certificate-service';

/**
 * POST /api/certificate/add-xp
 * Add XP to user's certificate (called on each tap)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, xpToAdd = 1 } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const certificate = await addCertificateXp(address, xpToAdd);

    return NextResponse.json({
      success: true,
      certificate: {
        totalXp: certificate.totalXp,
        level: certificate.level,
        updatedAt: certificate.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error adding certificate XP:', error);
    return NextResponse.json(
      { error: 'Failed to add XP' },
      { status: 500 }
    );
  }
}
