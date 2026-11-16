import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/discord/callback
 * Handle Discord OAuth2 callback
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/?error=discord_missing_params`);
    }

    let address: string;
    let redirectPath: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      address = decoded.address;
      redirectPath = decoded.redirect || '/';
    } catch {
      return NextResponse.redirect(`${baseUrl}/?error=discord_invalid_state`);
    }

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/discord/callback`,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Discord token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=discord_token_failed`);
    }

    const tokenData = await tokenRes.json();

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=discord_user_failed`);
    }

    const discordUser = await userRes.json();
    const discordId = discordUser.id;
    const discordUsername = discordUser.username;

    const existingUser = await prisma.mst_users.findUnique({
      where: { discord: discordId },
    });

    if (existingUser && existingUser.address.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}?error=discord_already_linked`);
    }

    await prisma.mst_users.update({
      where: { address: address.toLowerCase() },
      data: { discord: discordId, discordUsername },
    });

    return NextResponse.redirect(`${baseUrl}${redirectPath}?success=discord_connected`);
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=discord_callback_failed`);
  }
}
