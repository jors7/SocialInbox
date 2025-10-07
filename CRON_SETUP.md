# Automatic Token Refresh Setup

Your application now has automatic token refresh capability! Here's how to complete the setup:

## What's Already Done ✅

1. ✅ Created `refresh-tokens` Edge Function - automatically refreshes expiring tokens
2. ✅ Created `daily-cron` Edge Function - runs daily maintenance tasks
3. ✅ Created GitHub Actions workflow - triggers the cron job daily at 3 AM UTC
4. ✅ Updated UI - hides token expiry unless < 7 days remaining

## What You Need to Do 📋

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository: https://github.com/jors7/SocialInbox
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these two secrets:

   **Secret 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://uznzejmekcgwgtilbzby.supabase.co`

   **Secret 2:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (copy from your `.env.local` file - it's the long JWT token)

### Step 2: Test the Cron Job

1. Go to **Actions** tab in your GitHub repo
2. Click on **Daily Cron Jobs** workflow
3. Click **Run workflow** → **Run workflow** (manually trigger it)
4. Wait a few seconds and check that it runs successfully

### Step 3: Verify It's Working

After running the workflow, check the logs to ensure:
- Tokens were checked for expiration
- No errors occurred
- The job completed successfully

## How It Works 🔄

**Daily at 3:00 AM UTC**, GitHub Actions will automatically:
1. ✅ Refresh any tokens expiring within 7 days
2. ✅ Clean up messages older than 90 days
3. ✅ Pause automation for conversations with expired 24-hour windows

**In the Dashboard:**
- Token expiry badge is **hidden** if > 7 days remaining (normal)
- Token expiry badge **shows** only when < 7 days remaining (warning)
- Users can reconnect manually if needed

## Manual Token Refresh (Optional)

If you ever need to manually refresh tokens:

```bash
curl -X POST "https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/refresh-tokens" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Troubleshooting

If tokens aren't refreshing automatically:
1. Check GitHub Actions logs for errors
2. Verify secrets are set correctly
3. Ensure the workflow file is in `.github/workflows/daily-cron.yml`
4. Check that the workflow is enabled (not disabled)

---

**That's it!** Your token refresh is now fully automated. 🎉
