import { NextRequest, NextResponse } from 'next/server';
import { addCertificateXp } from '@/lib/services/certificate-service';

/**
 * POST /api/certificate/tap
 * Add XP when user taps certificate
 * Body: { address: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const certificate = await addCertificateXp(address, 1);

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error('Error adding certificate XP:', error);
    return NextResponse.json(
      { error: 'Failed to add XP' },
      { status: 500 }
    );
  }
}
