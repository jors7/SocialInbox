# Supabase Setup Commands

## Step 1: Get your Supabase Access Token
1. Go to https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Give it a name like "SocialInbox CLI"
4. Copy the token

## Step 2: Login to Supabase CLI
```bash
supabase login --token YOUR_ACCESS_TOKEN
```

## Step 3: Link your project
```bash
supabase link --project-ref uznzejmekcgwgtilbzby
```

## Step 4: Push database migrations
```bash
supabase db push
```

## Step 5: Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy instagram-webhook
supabase functions deploy meta-webhook
supabase functions deploy process-event
supabase functions deploy send-message
supabase functions deploy queue-processor
supabase functions deploy connect-instagram
supabase functions deploy test-instagram-connection
supabase functions deploy cron-scheduler
```

## Step 6: Set Function Secrets
```bash
# Generate encryption key
export ENCRYPTION_KEY=$(openssl rand -hex 16)
echo "Save this encryption key: $ENCRYPTION_KEY"

# Set secrets (replace with your actual Facebook app credentials)
supabase secrets set FACEBOOK_APP_ID=your_facebook_app_id
supabase secrets set FACEBOOK_APP_SECRET=your_facebook_app_secret
supabase secrets set ENCRYPTION_KEY=$ENCRYPTION_KEY
```

## Step 7: Create Storage Bucket
Run this SQL in your Supabase SQL Editor (https://app.supabase.com/project/uznzejmekcgwgtilbzby/editor):

```sql
-- Create media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Team members can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can view their media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team members can delete their media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] IN (
    SELECT team_id::text FROM public.team_members
    WHERE user_id = auth.uid()
  )
);
```

## Step 8: Enable Realtime
In your Supabase dashboard (https://app.supabase.com/project/uznzejmekcgwgtilbzby/database/replication):
1. Go to Database > Replication
2. Enable replication for these tables:
   - `conversations`
   - `messages`
   - `flow_executions`

## Step 9: Create Admin Account
After completing the above steps, run:
```bash
npm run create-admin
```

## Verification
Test your setup:
```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials!