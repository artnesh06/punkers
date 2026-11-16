import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/discord
 * Redirect user to Discord OAuth2 authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const redirect = searchParams.get('redirect') || '/';

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/discord/callback`;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Discord not configured' }, { status: 500 });
    }

    // Encode wallet address and redirect path in state param for callback
    const state = Buffer.from(JSON.stringify({ address: address.toLowerCase(), redirect })).toString('base64');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state,
    });

    return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
  } catch (error) {
    console.error('Discord auth error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initiate Discord auth' }, { status: 500 });
  }
}
