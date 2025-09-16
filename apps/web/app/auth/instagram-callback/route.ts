import { createServerComponentClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const origin = requestUrl.origin;

  if (error) {
    // User denied permissions
    return NextResponse.redirect(`${origin}/dashboard/connections?error=${error}`);
  }

  if (code) {
    const supabase = await createServerComponentClient();
    
    // Exchange the code for a session
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session) {
      return NextResponse.redirect(`${origin}/dashboard/connections?error=auth_failed`);
    }

    // Get the Facebook access token from the session
    const providerToken = session.provider_token;
    const providerRefreshToken = session.provider_refresh_token;

    if (!providerToken) {
      return NextResponse.redirect(`${origin}/dashboard/connections?error=no_token`);
    }

    try {
      // Call Edge Function to process Instagram connection
      const { data, error: functionError } = await supabase.functions.invoke('connect-instagram', {
        body: {
          accessToken: providerToken,
          refreshToken: providerRefreshToken,
          userId: session.user.id,
        },
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        return NextResponse.redirect(`${origin}/dashboard/connections?error=connection_failed`);
      }

      if (data?.error) {
        return NextResponse.redirect(`${origin}/dashboard/connections?error=${data.error}`);
      }

      // Success!
      return NextResponse.redirect(`${origin}/dashboard/connections?success=true`);
    } catch (err) {
      console.error('Connection processing error:', err);
      return NextResponse.redirect(`${origin}/dashboard/connections?error=processing_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard/connections`);
}