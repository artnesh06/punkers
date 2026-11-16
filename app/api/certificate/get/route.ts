import { NextRequest, NextResponse } from 'next/server';
import { getCertificateByAddress } from '@/lib/services/certificate-service';

/**
 * GET /api/certificate/get?address=0x...
 * Get certificate data from database
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

    const certificate = await getCertificateByAddress(address);

    if (!certificate) {
      return NextResponse.json({
        success: true,
        certificate: null,
      });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        totalXp: certificate.totalXp,
        level: certificate.level,
        updatedAt: certificate.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
