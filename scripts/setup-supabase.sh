#!/bin/bash

# Supabase Project Setup Script
# This script helps set up your Supabase project

set -e

echo "🚀 SocialInbox Supabase Setup"
echo "============================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Function to read input with default value
read_with_default() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "This script will help you set up your Supabase project."
echo ""

# Initialize Supabase project
if [ ! -d "supabase" ]; then
    echo "📦 Initializing Supabase..."
    supabase init
else
    echo "✅ Supabase already initialized"
fi

# Link to remote project
echo ""
echo "🔗 Linking to Supabase project..."
echo "To link an existing project, you'll need your project reference ID."
echo "You can find it in your Supabase dashboard URL: https://app.supabase.com/project/[PROJECT_REF]"
echo ""

PROJECT_REF=$(read_with_default "Enter your Supabase project reference ID" "")

if [ -n "$PROJECT_REF" ]; then
    supabase link --project-ref "$PROJECT_REF"
    echo "✅ Linked to Supabase project"
else
    echo "⚠️  No project reference provided. You'll need to link manually later:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
fi

# Push database migrations
echo ""
echo "🗄️  Pushing database migrations..."
echo "This will create all necessary tables and functions in your Supabase database."
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push
    echo "✅ Database migrations applied"
else
    echo "⚠️  Skipped database migrations. Run 'supabase db push' when ready."
fi

# Set up storage buckets
echo ""
echo "🗂️  Setting up storage buckets..."
echo "Creating storage bucket for media files..."

# Create storage bucket SQL
cat > supabase/migrations/20240108000000_storage_buckets.sql << 'EOF'
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
EOF

# Apply storage bucket migration
supabase db push

echo "✅ Storage buckets created"

# Generate environment variables
echo ""
echo "🔐 Generating environment variables..."

# Get project configuration
PROJECT_INFO=$(supabase status)
API_URL=$(echo "$PROJECT_INFO" | grep "API URL" | awk '{print $3}')
ANON_KEY=$(echo "$PROJECT_INFO" | grep "anon key" | awk '{print $3}')

# Create .env.local file
cat > apps/web/.env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY

# Facebook/Instagram App Configuration
# Get these from https://developers.facebook.com/
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption key for tokens (generate a random 32-character string)
ENCRYPTION_KEY=$(openssl rand -hex 16)
EOF

echo "✅ Created apps/web/.env.local"

# Create edge functions
echo ""
echo "🔧 Setting up Edge Functions..."

# Create webhook handler
mkdir -p supabase/functions/instagram-webhook
cat > supabase/functions/instagram-webhook/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Handle webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      if (mode === 'subscribe' && token === 'YOUR_VERIFY_TOKEN') {
        return new Response(challenge, { status: 200 })
      }
      
      return new Response('Forbidden', { status: 403 })
    }
    
    // Handle webhook events
    if (req.method === 'POST') {
      const body = await req.json()
      
      // Process Instagram webhook
      for (const entry of body.entry) {
        const { data, error } = await supabase
          .from('webhook_events')
          .insert({
            platform: 'instagram',
            event_type: 'message',
            payload: entry,
            status: 'pending'
          })
      }
      
      return new Response('OK', { status: 200 })
    }
    
    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
EOF

echo "✅ Edge functions created"

# Create deployment checklist
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Deployment Checklist

## ✅ Supabase Setup
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Storage buckets configured
- [ ] Edge functions deployed
- [ ] RLS policies verified

## 🔐 Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key  
- [ ] `FACEBOOK_APP_ID` - Facebook app ID
- [ ] `FACEBOOK_APP_SECRET` - Facebook app secret
- [ ] `NEXT_PUBLIC_APP_URL` - Your app URL
- [ ] `ENCRYPTION_KEY` - 32-character encryption key

## 📱 Facebook App Setup
1. Go to https://developers.facebook.com/
2. Create a new app (Business type)
3. Add Instagram Basic Display and Instagram Messaging products
4. Configure OAuth redirect URLs:
   - `https://your-domain.com/api/auth/instagram/callback`
5. Add webhook URL:
   - `https://your-project.supabase.co/functions/v1/instagram-webhook`
6. Subscribe to webhook fields:
   - `messages`
   - `messaging_postbacks`

## 🚀 Deployment Steps
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel
4. Deploy!

## 📝 Post-Deployment
- [ ] Test Instagram authentication
- [ ] Verify webhook receiving messages
- [ ] Check real-time subscriptions
- [ ] Monitor error logs
EOF

echo ""
echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update apps/web/.env.local with your actual values"
echo "2. Deploy edge functions: supabase functions deploy"
echo "3. Set up your Facebook app at https://developers.facebook.com/"
echo "4. Check DEPLOYMENT_CHECKLIST.md for detailed deployment steps"
echo ""
echo "🎉 Your Supabase project is ready!"