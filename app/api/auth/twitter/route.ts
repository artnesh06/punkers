import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

/**
 * GET /api/auth/twitter
 * Redirect user to Twitter OAuth2 authorization page (PKCE flow)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const redirect = searchParams.get('redirect') || '/';

    if (!address) {
      return NextResponse.json({ success: false, error: 'Address is required' }, { status: 400 });
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Twitter not configured' }, { status: 500 });
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Encode wallet address + code verifier + redirect in state
    const state = Buffer.from(
      JSON.stringify({ address: address.toLowerCase(), codeVerifier, redirect })
    ).toString('base64');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'users.read tweet.read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params.toString()}`);
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initiate Twitter auth' }, { status: 500 });
  }
}
