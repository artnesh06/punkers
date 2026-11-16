import { NextRequest, NextResponse } from 'next/server';

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;

/**
 * Get account profile from OpenSea
 * Endpoint: GET /accounts/{address}
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    if (!OPENSEA_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenSea API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.opensea.io/api/v2/accounts/${address}`;
    
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
      account: data,
    });
  } catch (error: any) {
    console.error('Error fetching account profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch account profile',
      },
      { status: 500 }
    );
  }
}
