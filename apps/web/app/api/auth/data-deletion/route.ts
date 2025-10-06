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

    // Generate a unique confirmation code for this deletion request
    const confirmationCode = crypto.randomBytes(16).toString('hex');

    // Log the data deletion request
    console.log(`Data deletion request received for user ${userId}, confirmation: ${confirmationCode}`);

    // Store the deletion request in the database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Store deletion request
      // You may need to create this table first
      const { error } = await supabase.from('data_deletion_requests').insert({
        facebook_user_id: userId,
        confirmation_code: confirmationCode,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to store deletion request:', error);
        // Continue anyway - we still return a confirmation code
      }

      // Optionally: Queue the actual deletion process
      // You might want to implement a background job to handle this
      // For now, we just mark accounts for deletion

      const { error: updateError } = await supabase
        .from('ig_accounts')
        .update({
          connected_tools_enabled: false,
          // Add a deletion_scheduled_at field if you want to track this
          updated_at: new Date().toISOString(),
        })
        .eq('instagram_user_id', userId);

      if (updateError) {
        console.error('Failed to mark accounts for deletion:', updateError);
      }
    }

    // Return the confirmation URL and code
    // Facebook requires this format
    const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/data-deletion-status?code=${confirmationCode}`;

    return NextResponse.json({
      url: confirmationUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Data deletion error:', error);

    // Return error but with 200 status
    // Facebook may retry if we return error status
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process deletion request',
    });
  }
}
