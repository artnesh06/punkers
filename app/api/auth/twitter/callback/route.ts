import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/twitter/callback
 * Handle Twitter OAuth2 callback (PKCE flow)
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/?error=twitter_missing_params`);
    }

    let address: string;
    let codeVerifier: string;
    let redirectPath: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      address = decoded.address;
      codeVerifier = decoded.codeVerifier;
      redirectPath = decoded.redirect || '/';
    } catch {
      return NextResponse.redirect(`${baseUrl}/?error=twitter_invalid_state`);
    }

    const redirectUri = `${baseUrl}/api/auth/twitter/callback`;
    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Twitter token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=twitter_token_failed`);
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=twitter_user_failed`);
    }

    const { data: twitterUser } = await userRes.json();
    const twitterId = twitterUser.id;
    const twitterUsername = twitterUser.username;

    const existingUser = await prisma.mst_users.findUnique({
      where: { twitter: twitterId },
    });

    if (existingUser && existingUser.address.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=twitter_already_linked`);
    }

    await prisma.mst_users.update({
      where: { address: address.toLowerCase() },
      data: { twitter: twitterId, twitterUsername },
    });

    return NextResponse.redirect(`${baseUrl}${redirectPath}?success=twitter_connected`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=twitter_callback_failed`);
  }
}
