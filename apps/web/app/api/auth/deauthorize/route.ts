import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Parse Facebook signed request
function parseSignedRequest(signedRequest: string, appSecret: string): any {
  const [encodedSig, payload] = signedRequest.split('.');

  // Decode signature
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  // Decode payload
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  );

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error('Invalid signature');
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      );
    }

    // Verify and parse the signed request
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error('META_APP_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    const userId = data.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Log the deauthorization event
    console.log(`User ${userId} deauthorized the app`);

    // Optionally: Mark Instagram accounts as disconnected
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find and disable all Instagram accounts connected with this Facebook user
      // Note: This is optional - you may want to keep the data for reauth
      const { error } = await supabase
        .from('ig_accounts')
        .update({
          connected_tools_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('instagram_user_id', userId);

      if (error) {
        console.error('Failed to update account status:', error);
        // Don't fail the request - Facebook still expects 200 OK
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Deauthorization processed successfully',
    });
  } catch (error) {
    console.error('Deauthorize error:', error);

    // Facebook requires 200 OK response even on errors
    // Otherwise they'll retry repeatedly
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
