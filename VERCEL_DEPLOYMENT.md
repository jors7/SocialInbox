# Vercel Deployment Guide for SocialInbox

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
- [x] Supabase project set up and running
- [x] Database migrations applied
- [x] Edge functions deployed
- [ ] GitHub repository ready
- [ ] Vercel account created (free at vercel.com)

## 🚀 Quick Start

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Project
```bash
vercel link
```
Choose:
- Set up and deploy: Y
- Which scope: Select your account
- Link to existing project? N (for new project)
- Project name: socialinbox (or your preference)
- Directory: ./apps/web

### Step 4: Set Environment Variables

Run this command to set each variable:
```bash
# From your .env.local file
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Generate new encryption key for production
vercel env add ENCRYPTION_KEY
```

Your values:
- `NEXT_PUBLIC_SUPABASE_URL`: https://uznzejmekcgwgtilbzby.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bnplam1la2Nnd2d0aWxiemJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjQ4MzMsImV4cCI6MjA3NDMwMDgzM30.m3dh_yb7oyGCWt6hjiHKW9452ZX3cKybk-F1RBdXRrU
- `SUPABASE_SERVICE_ROLE_KEY`: [Use your service role key from .env.local]
- `ENCRYPTION_KEY`: [Generate with: openssl rand -hex 16]

### Step 5: Deploy
```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret!) | Supabase Dashboard > Settings > API |
| `ENCRYPTION_KEY` | 32-char key for encrypting tokens | Generate: `openssl rand -hex 16` |

### Optional Variables (for Instagram integration)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `FACEBOOK_APP_ID` | Facebook app ID | developers.facebook.com |
| `FACEBOOK_APP_SECRET` | Facebook app secret | developers.facebook.com |

## 🌐 Post-Deployment Configuration

### 1. Get Your Vercel URLs
After deployment, you'll get URLs like:
- Preview: `https://socialinbox-[hash]-[username].vercel.app`
- Production: `https://socialinbox.vercel.app`

### 2. Update Supabase Settings
Add your Vercel domain to allowed URLs:
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add to Site URL: `https://your-app.vercel.app`
3. Add to Redirect URLs:
   - `https://your-app.vercel.app/*`
   - `https://your-app.vercel.app/auth/callback`

### 3. Configure Custom Domain (Optional)
1. In Vercel Dashboard > Settings > Domains
2. Add your domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with new domain

### 4. Set Up GitHub Integration
1. Go to Vercel Dashboard > Settings > Git
2. Connect your GitHub repository
3. Configure:
   - Production Branch: `main`
   - Preview Branches: All branches
   - Build & Development Settings: Already configured in vercel.json

## 🧪 Testing Your Deployment

### Basic Functionality Tests
1. **Homepage Load**: Visit your Vercel URL
2. **Login/Signup**: Try creating an account
3. **Dashboard Access**: Login and access /dashboard
4. **Database Connection**: Check if data loads properly

### Troubleshooting Common Issues

#### "Team configuration not found"
- Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check RLS policies are properly configured

#### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

#### 500 Errors
- Check Function logs in Vercel dashboard
- Verify all environment variables are set
- Check Supabase connection

## 📊 Monitoring

### Vercel Dashboard
- **Analytics**: Enable Web Analytics for performance metrics
- **Functions**: Monitor API routes and edge functions
- **Logs**: Real-time logs for debugging

### Supabase Dashboard
- **Database**: Monitor queries and performance
- **Auth**: Track user signups and logins
- **Storage**: Monitor media uploads

## 🔄 Continuous Deployment

With GitHub integration:
- Push to `main` → Automatic production deployment
- Push to other branches → Preview deployments
- Pull requests → Preview URLs in PR comments

## 🛠️ Useful Commands

```bash
# View all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# View deployment logs
vercel logs

# Remove a deployment
vercel remove [deployment-url]

# Alias a deployment to production
vercel promote [deployment-url]
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

## 🆘 Need Help?

1. Check Vercel deployment logs
2. Review Supabase function logs
3. Verify environment variables
4. Check browser console for client errors
5. Review this guide for missed steps

---

Last updated: January 2025
Your Supabase Project: uznzejmekcgwgtilbzby