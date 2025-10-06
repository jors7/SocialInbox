# SocialInbox Deployment Guide

This guide walks you through deploying SocialInbox to production with Supabase and configuring Meta/Instagram integration.

## Prerequisites

- Supabase account and project created
- Meta Developer account
- Meta App created with Instagram product added
- Instagram Business account connected to a Facebook Page
- Node.js 18+ and npm installed
- Supabase CLI installed (`brew install supabase/tap/supabase`)

## Quick Start

### 1. Environment Setup

Run the automated environment setup script:

```bash
npm run setup:env
```

This will:
- Create `apps/web/.env.local` with all required variables
- Generate secure random tokens for webhooks and encryption
- Prompt you for Supabase and Meta credentials

**Required Information:**
- Supabase URL (from Project Settings → API)
- Supabase Anon Key (from Project Settings → API)
- Supabase Service Role Key (from Project Settings → API)
- Meta App ID (from Meta App Dashboard → Settings → Basic)
- Meta App Secret (from Meta App Dashboard → Settings → Basic)

### 2. Deploy to Supabase

Run the automated deployment script:

```bash
npm run deploy:supabase
```

This will:
- Login to Supabase (if needed)
- Link to your Supabase project
- Set up all Edge Function secrets
- Deploy all Edge Functions
- Display your webhook URLs and configuration details

### 3. Configure Meta App

#### A. OAuth Settings (Facebook Login)

Go to Meta App Dashboard → Facebook Login → Settings:

1. **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/auth/facebook-callback
   http://localhost:3000/auth/facebook-callback
   ```

2. **Enable Settings**:
   - ✅ Client OAuth Login
   - ✅ Web OAuth Login
   - ✅ Enforce HTTPS
   - ✅ Use Strict Mode for redirect URIs

#### B. Privacy & Data Deletion URLs

Go to Meta App Dashboard → Settings → Basic:

1. **Deauthorize Callback URL**:
   ```
   https://yourdomain.com/api/auth/deauthorize
   ```

2. **Data Deletion Request URL**:
   ```
   https://yourdomain.com/api/auth/data-deletion
   ```

#### C. Instagram Webhooks

Go to Meta App Dashboard → Products → Webhooks → Instagram:

1. Click **"Edit Subscription"** or **"Configure Webhooks"**

2. **Callback URL**:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/instagram-webhook
   ```
   *(Replace YOUR-PROJECT-REF with your actual Supabase project reference)*

3. **Verify Token**:
   - Use the `META_WEBHOOK_VERIFY_TOKEN` from your deployment output
   - This was automatically generated during setup

4. **Subscribe to Fields**:
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ message_echoes
   - ✅ messaging_handovers (optional)

5. Click **"Verify and Save"**

#### D. Permissions

Go to Meta App Dashboard → API setup with Facebook login:

1. **Required Permissions** (click "Add required content permissions"):
   - `instagram_basic`
   - `instagram_content_publishing`
   - `pages_read_engagement`
   - `business_management`
   - `pages_show_list`

2. **Required Messaging Permissions** (click "Add required messaging permissions"):
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_read_engagement`
   - `pages_show_list`
   - `business_management`

### 4. Database Setup

Run database migrations:

```bash
npm run db:migrate
```

Or push to remote Supabase:

```bash
supabase db push
```

### 5. Deploy Frontend

#### Option A: Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables from `apps/web/.env.local`
3. Deploy

#### Option B: Manual Deployment

```bash
npm run build
# Deploy the built files from apps/web/.next
```

### 6. Test Your Setup

#### Test OAuth Connection:

1. Start your app: `npm run dev`
2. Navigate to `/dashboard/connections`
3. Click "Connect Instagram Account"
4. Complete Facebook OAuth flow
5. Verify account appears in dashboard

#### Test Webhooks:

1. Send a DM to your Instagram Business account
2. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs instagram-webhook
   ```
3. Verify message appears in your database:
   - Check `conversations` table
   - Check `messages` table

## Environment Variables Reference

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Meta App
META_APP_ID=xxx
META_APP_SECRET=xxx
NEXT_PUBLIC_FACEBOOK_APP_ID=xxx  # Same as META_APP_ID

# Security
META_WEBHOOK_VERIFY_TOKEN=xxx  # Auto-generated
APP_ENCRYPTION_KEY=xxx  # Auto-generated

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
META_GRAPH_API_VERSION=v20.0
```

## Troubleshooting

### Webhook Verification Fails

- Verify the callback URL is correct
- Check that the verify token matches exactly
- Ensure Edge Function is deployed and accessible
- Check Edge Function logs for errors

### OAuth Flow Fails

- Verify redirect URIs match exactly in Meta settings
- Check that all required permissions are added
- Ensure `NEXT_PUBLIC_FACEBOOK_APP_ID` is set correctly
- Check browser console for errors

### Messages Not Received

- Verify webhooks are subscribed to `messages` field
- Check Edge Function logs for incoming webhooks
- Ensure Instagram account is in `ig_accounts` table
- Verify Instagram account has Connected Tools enabled

### Token Encryption Errors

- Ensure `APP_ENCRYPTION_KEY` is 64 characters (32 bytes hex)
- Verify the same key is used in both Edge Functions and frontend
- Check that `pgcrypto` extension is enabled in Supabase

## Security Checklist

Before going to production:

- [ ] All secrets are properly configured in Supabase
- [ ] Webhook signature verification is enabled
- [ ] HTTPS is enforced for all OAuth redirects
- [ ] Rate limiting is configured
- [ ] RLS policies are enabled on all tables
- [ ] Service role key is never exposed to frontend
- [ ] Encryption key is securely stored
- [ ] App review completed in Meta Dashboard

## Monitoring

### Edge Function Logs

```bash
# View real-time logs
supabase functions logs instagram-webhook --tail

# View specific function
supabase functions logs meta-webhook
```

### Database Queries

Monitor your queue tables:
- `flow_executions` - Flow processing queue
- `message_queue` - Outgoing message queue
- `api_queue` - Rate-limited API calls

## Support

For issues:
- Check the logs in Supabase Dashboard → Edge Functions
- Review Meta webhook configuration
- Check database table contents
- Review this deployment guide

## Next Steps

After successful deployment:

1. Create your first automation flow
2. Set up triggers for comments/mentions
3. Test the complete user journey
4. Submit app for Meta review (required for production)
5. Monitor performance and errors

---

**Note**: Development mode allows up to 5 users without app review. For production with unlimited users, you must complete Meta's app review process.
