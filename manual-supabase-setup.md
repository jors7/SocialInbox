# Manual Supabase Setup Guide

After creating your Supabase project, follow these steps:

## 1. Link Your Project

```bash
# Replace YOUR_PROJECT_REF with your actual project reference ID
supabase link --project-ref YOUR_PROJECT_REF
```

## 2. Push Database Migrations

```bash
# This creates all tables, functions, and policies
supabase db push
```

## 3. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy instagram-webhook
supabase functions deploy process-event
supabase functions deploy send-message
supabase functions deploy queue-processor
supabase functions deploy connect-instagram
```

## 4. Set Function Secrets

```bash
# Set your Facebook app credentials
supabase secrets set FACEBOOK_APP_ID=your_app_id
supabase secrets set FACEBOOK_APP_SECRET=your_app_secret
supabase secrets set ENCRYPTION_KEY=$(openssl rand -hex 16)
```

## 5. Enable Realtime

In your Supabase dashboard:
1. Go to Database > Replication
2. Enable replication for these tables:
   - `conversations`
   - `messages`
   - `flow_executions`

## 6. Create Storage Bucket

Run this SQL in the SQL editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
```

## 7. Get Your API Keys

From your Supabase project settings:
- `API URL`: Found in Settings > API
- `anon key`: Found in Settings > API
- `service_role key`: Found in Settings > API (keep this secret!)

## 8. Update Environment Variables

Add to `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_api_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎉 Your Supabase project is ready!

Test the connection:
```bash
npm run dev:web
```

Visit http://localhost:3000 and try signing up!