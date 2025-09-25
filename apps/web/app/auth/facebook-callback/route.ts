import { NextRequest, NextResponse } from 'next/server';
import { createServerActionClient } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle errors from Facebook
  if (error) {
    console.error('Facebook OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/dashboard/connections?error=${encodeURIComponent(
          errorDescription || 'Failed to connect Facebook account'
        )}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=no_code', request.url)
    );
  }

  try {
    const supabase = await createServerActionClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://graph.facebook.com/v20.0/oauth/access_token?' +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/facebook-callback`,
        code: code,
      })
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData);
      return NextResponse.redirect(
        new URL('/dashboard/connections?error=token_exchange_failed', request.url)
      );
    }

    // Call Supabase Edge Function to handle the connection
    const { data, error: connectError } = await supabase.functions.invoke('connect-instagram', {
      body: {
        accessToken: tokenData.access_token,
        userId: user.id,
      },
    });

    if (connectError || data?.error) {
      console.error('Failed to connect Instagram:', connectError || data?.error);
      const errorMessage = data?.error === 'no_instagram'
        ? 'No Instagram Business account found. Please connect your Instagram to a Facebook Page first.'
        : 'Failed to connect Instagram account';

      return NextResponse.redirect(
        new URL(
          `/dashboard/connections?error=${encodeURIComponent(errorMessage)}`,
          request.url
        )
      );
    }

    // Success
    return NextResponse.redirect(
      new URL('/dashboard/connections?success=instagram_connected', request.url)
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=unexpected_error', request.url)
    );
  }
}