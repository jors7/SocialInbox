# SocialInbox Deployment Guide

This guide will help you deploy SocialInbox with Supabase, GitHub, and Vercel.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase account (https://supabase.com)
- GitHub account (https://github.com)
- Vercel account (https://vercel.com)
- Facebook Developer account (https://developers.facebook.com)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/socialinbox.git
cd socialinbox

# Install dependencies
npm install
```

### 2. Supabase Setup

```bash
# Run the Supabase setup script
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

This will:
- Initialize Supabase project
- Apply database migrations
- Create storage buckets
- Set up edge functions
- Generate environment variables

### 3. GitHub Setup

```bash
# Run the GitHub setup script
chmod +x scripts/setup-github.sh
./scripts/setup-github.sh
```

This will:
- Initialize Git repository
- Create GitHub Actions workflows
- Set up issue templates
- Create and push to remote repository

### 4. Vercel Deployment

```bash
# Run the Vercel setup script
chmod +x scripts/setup-vercel.sh
./scripts/setup-vercel.sh
```

This will:
- Link to Vercel project
- Configure environment variables
- Deploy preview build

## 📋 Manual Setup Steps

### 1. Facebook App Configuration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add these products:
   - Instagram Basic Display
   - Instagram Messaging

4. Configure OAuth Redirect URLs:
   ```
   https://your-domain.vercel.app/api/auth/instagram/callback
   ```

5. Configure Webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/instagram-webhook
   ```

6. Subscribe to webhook fields:
   - messages
   - messaging_postbacks

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example apps/web/.env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase project settings
- `FACEBOOK_APP_ID` - From Facebook app settings
- `FACEBOOK_APP_SECRET` - From Facebook app settings
- `ENCRYPTION_KEY` - Generate with `openssl rand -hex 16`

### 3. Supabase Configuration

1. **Database Setup**
   ```bash
   # Push all migrations
   supabase db push
   ```

2. **Edge Functions**
   ```bash
   # Deploy edge functions
   supabase functions deploy instagram-webhook
   supabase functions deploy process-event
   supabase functions deploy send-message
   ```

3. **Enable Realtime**
   - Go to Supabase Dashboard > Database > Replication
   - Enable replication for these tables:
     - conversations
     - messages
     - flow_executions

### 4. Vercel Environment Variables

Add these in Vercel Dashboard > Settings > Environment Variables:

```bash
# Public (all environments)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Secret (production only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
ENCRYPTION_KEY=your-encryption-key
```

## 🧪 Testing

### Local Development

```bash
# Start development server
npm run dev

# Run in separate terminals:
# Terminal 1 - Web app
cd apps/web && npm run dev

# Terminal 2 - Worker (if needed)
cd apps/worker && npm run dev
```

### Test Checklist

- [ ] User registration and login
- [ ] Instagram account connection
- [ ] Create and publish a flow
- [ ] Send a test message
- [ ] Receive webhook messages
- [ ] Real-time message updates

## 🚢 Production Deployment

### 1. Deploy to Vercel

```bash
# Deploy to production
./scripts/deploy-production.sh
```

### 2. Update Production URLs

After deployment, update:

1. **Facebook App**
   - OAuth Redirect: `https://your-domain.com/api/auth/instagram/callback`
   - Webhook URL: `https://your-project.supabase.co/functions/v1/instagram-webhook`

2. **Supabase Edge Functions**
   - Update CORS settings with your domain

### 3. Custom Domain (Optional)

1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Update environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

## 🔍 Monitoring

### Vercel
- Function logs: Vercel Dashboard > Functions
- Analytics: Vercel Dashboard > Analytics

### Supabase
- Database metrics: Supabase Dashboard > Reports
- Function logs: Supabase Dashboard > Edge Functions

### Error Tracking (Optional)
```bash
# Add Sentry
npm install @sentry/nextjs
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Vercel build logs
   - Ensure all dependencies are listed
   - Verify environment variables

2. **Instagram Connection Issues**
   - Verify Facebook app configuration
   - Check OAuth redirect URLs
   - Ensure app is in live mode

3. **Webhook Not Receiving Messages**
   - Verify webhook URL in Facebook app
   - Check edge function logs
   - Test with Facebook's webhook tester

4. **Database Errors**
   - Check RLS policies
   - Verify migrations applied
   - Review Supabase logs

### Debug Commands

```bash
# Check Supabase status
supabase status

# View function logs
supabase functions serve instagram-webhook

# Test database connection
npm run test:db
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Support

- GitHub Issues: [Report bugs or request features](https://github.com/your-username/socialinbox/issues)
- Documentation: Check `/docs` folder for detailed guides

---

## 🎯 Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Facebook app in live mode
- [ ] OAuth URLs updated
- [ ] Webhook verified and working
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] Monitoring enabled
- [ ] Backups configured
## 🔐 Edge Functions JWT Verification

### Functions That Require JWT Verification OFF

Some Edge Functions need to accept requests from external services (like Meta/Instagram webhooks) that don't have Supabase JWT tokens. These functions must be deployed with the `--no-verify-jwt` flag.

**Functions without JWT verification:**
- `instagram-webhook` - Receives webhooks from Instagram/Meta
- `cron-scheduler` - Called by external cron service (cron-job.org)

### Quick Deploy Script

Use the provided script to deploy all webhook functions with correct settings:

```bash
./deploy-webhooks.sh
```

This script will:
1. Deploy `instagram-webhook` without JWT verification
2. Deploy `cron-scheduler` without JWT verification

### Manual Deployment

If you need to deploy individually:

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN=your_access_token_here

# Deploy webhook without JWT verification
supabase functions deploy instagram-webhook --no-verify-jwt

# Deploy cron scheduler without JWT verification
supabase functions deploy cron-scheduler --no-verify-jwt
```

### Other Edge Functions

These functions use JWT verification (default) and can be deployed normally:

```bash
# These require authentication
supabase functions deploy queue-processor
supabase functions deploy update-contact-names
supabase functions deploy aggregate-analytics
```

## ⚠️ Why JWT Verification Keeps Turning Back On

The JWT verification setting is stored in Supabase's infrastructure, not in your code. If you deploy a function without explicitly using the `--no-verify-jwt` flag, it will default to requiring JWT verification.

**Always use the deployment script** (`./deploy-webhooks.sh`) to ensure webhook functions are deployed with the correct settings.

## 🧪 Testing Webhook Functions

After deployment, test that JWT verification is disabled:

```bash
# Should return webhook verification response, not 401
curl "https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/instagram-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

If you get a 401 error, the JWT verification is still enabled. Re-run the deployment script.

## 🔧 Webhook Troubleshooting

### Problem: Webhook returns 401 Unauthorized

**Solution:** The function was deployed with JWT verification enabled. Run:
```bash
./deploy-webhooks.sh
```

### Problem: Can't find SUPABASE_ACCESS_TOKEN

**Solution:** Get your access token from Supabase Dashboard > Settings > API > Access Tokens. Update the token in `deploy-webhooks.sh`.

### Problem: Script permission denied

**Solution:** Make the script executable:
```bash
chmod +x deploy-webhooks.sh
```
