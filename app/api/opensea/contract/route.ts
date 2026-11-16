import { NextRequest, NextResponse } from 'next/server';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

/**
 * Get contract details from OpenSea
 * Endpoint: GET /chain/{chain}/contract/{address}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address');
    const chain = searchParams.get('chain') || 'ethereum';

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Contract address is required' },
        { status: 400 }
      );
    }

    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenSea API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.opensea.io/api/v2/chain/${chain}/contract/${contractAddress}`;
    
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenSea API error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `OpenSea API error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      contract: data,
    });
  } catch (error: any) {
    console.error('Error fetching contract details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch contract details',
      },
      { status: 500 }
    );
  }
}
