#!/bin/bash

echo "🚀 Setting up SocialInbox local environment..."
echo ""

# Check if root .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Please create .env.local in the root directory with your Supabase credentials"
    echo "   You can copy from .env.local.example and fill in your values"
    exit 1
fi

# Create apps/web/.env.local
echo "📝 Creating apps/web/.env.local..."
cat > apps/web/.env.local << 'EOF'
# Copy these values from your Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Meta App Configuration (optional for development)
META_APP_ID=test-app-id
META_APP_SECRET=test-app-secret
META_WEBHOOK_VERIFY_TOKEN=test-token
META_GRAPH_API_VERSION=v20.0

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENCRYPTION_KEY=test-encryption-key-min-32-chars-here-123456
EOF

# Create apps/worker/.env.local
echo "📝 Creating apps/worker/.env.local..."
cat > apps/worker/.env.local << 'EOF'
# Copy these values from your Supabase project
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_BATCH_SIZE=10
EOF

echo ""
echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: You need to:"
echo "   1. Edit apps/web/.env.local"
echo "   2. Edit apps/worker/.env.local"
echo "   3. Replace 'your-project', 'your-anon-key', and 'your-service-key'"
echo "      with your actual Supabase credentials"
echo ""
echo "📚 Get your Supabase credentials from:"
echo "   https://app.supabase.com/project/YOUR_PROJECT/settings/api"
echo ""
echo "Once updated, run: npm run dev"