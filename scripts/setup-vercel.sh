#!/bin/bash

# Vercel Deployment Setup Script
# This script helps set up your Vercel deployment

set -e

echo "▲ SocialInbox Vercel Setup"
echo "=========================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
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

echo "This script will help you deploy SocialInbox to Vercel."
echo ""

# Login to Vercel
echo "🔐 Logging in to Vercel..."
vercel login

# Link to Vercel project
echo ""
echo "🔗 Linking to Vercel project..."
echo "Choose 'Yes' to link to an existing project, or 'No' to create a new one."
vercel link

# Create environment variables file
echo ""
echo "🔐 Setting up environment variables..."

cat > .env.production << 'EOF'
# Production Environment Variables Template
# Copy this to Vercel dashboard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Facebook/Instagram Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# App URL (automatically set by Vercel)
NEXT_PUBLIC_APP_URL=https://$VERCEL_URL
EOF

echo "✅ Created .env.production template"

# Set environment variables in Vercel
echo ""
echo "📝 Setting environment variables in Vercel..."
echo ""
echo "Would you like to set environment variables now? (Requires values ready)"
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Supabase
    SUPABASE_URL=$(read_with_default "NEXT_PUBLIC_SUPABASE_URL" "")
    if [ -n "$SUPABASE_URL" ]; then
        vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "$SUPABASE_URL")
    fi
    
    SUPABASE_ANON=$(read_with_default "NEXT_PUBLIC_SUPABASE_ANON_KEY" "")
    if [ -n "$SUPABASE_ANON" ]; then
        vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "$SUPABASE_ANON")
    fi
    
    SUPABASE_SERVICE=$(read_with_default "SUPABASE_SERVICE_ROLE_KEY" "")
    if [ -n "$SUPABASE_SERVICE" ]; then
        vercel env add SUPABASE_SERVICE_ROLE_KEY production < <(echo "$SUPABASE_SERVICE")
    fi
    
    # Facebook
    FB_APP_ID=$(read_with_default "FACEBOOK_APP_ID" "")
    if [ -n "$FB_APP_ID" ]; then
        vercel env add FACEBOOK_APP_ID production < <(echo "$FB_APP_ID")
    fi
    
    FB_APP_SECRET=$(read_with_default "FACEBOOK_APP_SECRET" "")
    if [ -n "$FB_APP_SECRET" ]; then
        vercel env add FACEBOOK_APP_SECRET production < <(echo "$FB_APP_SECRET")
    fi
    
    # Encryption key
    echo "Generating encryption key..."
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    vercel env add ENCRYPTION_KEY production < <(echo "$ENCRYPTION_KEY")
    echo "✅ Generated and saved encryption key"
else
    echo ""
    echo "⚠️  You'll need to add environment variables manually in Vercel dashboard:"
    echo "   https://vercel.com/dashboard/[your-project]/settings/environment-variables"
fi

# Create deployment scripts
echo ""
echo "📝 Creating deployment scripts..."

cat > scripts/deploy-preview.sh << 'EOF'
#!/bin/bash
# Deploy preview build to Vercel

echo "🚀 Deploying preview to Vercel..."
vercel --build-env NODE_ENV=production
EOF

cat > scripts/deploy-production.sh << 'EOF'
#!/bin/bash
# Deploy production build to Vercel

echo "🚀 Deploying to production..."
echo "⚠️  This will deploy to your live production environment!"
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod --build-env NODE_ENV=production
else
    echo "❌ Deployment cancelled"
fi
EOF

chmod +x scripts/deploy-preview.sh
chmod +x scripts/deploy-production.sh

echo "✅ Deployment scripts created"

# Create post-deployment checklist
cat > VERCEL_DEPLOYMENT.md << 'EOF'
# Vercel Deployment Guide

## Pre-Deployment Checklist
- [ ] All environment variables set in Vercel dashboard
- [ ] Supabase project is running and accessible
- [ ] Facebook app is configured with correct redirect URLs
- [ ] Latest code is pushed to GitHub

## Environment Variables Required

### Public Variables (Client-side)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_APP_URL` - Your app URL (auto-set by Vercel)

### Private Variables (Server-side)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret  
- `ENCRYPTION_KEY` - 32-character encryption key

## Deployment Commands

### Preview Deployment
```bash
./scripts/deploy-preview.sh
```

### Production Deployment
```bash
./scripts/deploy-production.sh
```

## Post-Deployment Steps

1. **Update OAuth Redirect URLs**
   - Facebook App: `https://your-domain.vercel.app/api/auth/instagram/callback`

2. **Update Webhook URLs**
   - Instagram Webhook: `https://your-project.supabase.co/functions/v1/instagram-webhook`

3. **Configure Custom Domain** (Optional)
   - Add custom domain in Vercel dashboard
   - Update DNS settings
   - Update environment variables with new domain

4. **Test Critical Flows**
   - [ ] User registration/login
   - [ ] Instagram account connection
   - [ ] Sending a test message
   - [ ] Webhook message reception
   - [ ] Real-time updates

## Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Function Logs**: Check Vercel Functions tab
- **Analytics**: Enable Vercel Analytics for performance monitoring

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Runtime Errors
- Check function logs
- Verify Supabase connection
- Check browser console for client errors

### Instagram Integration Issues
- Verify Facebook app configuration
- Check webhook subscriptions
- Ensure tokens are properly encrypted
EOF

# Deploy preview
echo ""
echo "🚀 Ready to deploy!"
echo ""
read -p "Deploy a preview now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --build-env NODE_ENV=production
    echo ""
    echo "✅ Preview deployed!"
    echo "Check your terminal for the preview URL."
else
    echo "You can deploy anytime with: vercel"
fi

echo ""
echo "✅ Vercel setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add remaining environment variables in Vercel dashboard"
echo "2. Update OAuth redirect URLs with your Vercel domain"
echo "3. Deploy to production when ready: ./scripts/deploy-production.sh"
echo "4. Set up custom domain (optional)"
echo ""
echo "📚 See VERCEL_DEPLOYMENT.md for detailed deployment guide"