# Deployment Guide

## GitHub Actions CI/CD Setup

### Required GitHub Secrets

To enable the Vercel deployment workflow, you need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

#### Vercel Secrets (Required for deployment)
- `VERCEL_TOKEN`: Your Vercel personal access token
  - Get it from: https://vercel.com/account/tokens
- `VERCEL_ORG_ID`: Your Vercel organization ID
  - Find it in your Vercel project settings
- `VERCEL_PROJECT_ID`: Your Vercel project ID
  - Find it in your Vercel project settings

#### Optional: Supabase Secrets (if you want to use real values in CI)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Manual Vercel Setup

If you prefer to deploy manually or set up Vercel for the first time:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

## Environment Variables

Make sure to set the following environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

You can set these in the Vercel dashboard under Project Settings → Environment Variables.

## Current CI/CD Status

✅ Build checks are passing
✅ Test suite is running
✅ TypeScript type checking is enabled
⚠️ ESLint is temporarily disabled (252 errors need fixing)
❌ Vercel deployment requires secrets to be configured