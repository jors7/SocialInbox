# Meta App Setup Guide for Instagram Messaging

This guide provides the correct, up-to-date process for setting up a Meta app for Instagram DM automation using the Messenger API for Instagram (as of late 2024/2025).

## Prerequisites

Before you begin, ensure you have:

1. **Instagram Professional Account** (Business or Creator type)
2. **Facebook Page** that is linked to your Instagram account
3. **Meta Business Manager** account

## Step 1: Create Meta Business App

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as the app type (NOT Consumer)
4. Fill in:
   - App Name: `SocialInbox`
   - App Contact Email: Your email
   - Business Portfolio: Select or create one

## Step 2: Add Required Products

### Add Messenger Product
1. In your app dashboard, click **"Add Product"**
2. Find **"Messenger"** and click **"Set Up"**
   - This includes Instagram Messaging capabilities

### Add Webhooks
1. Click **"Add Product"**
2. Find **"Webhooks"** and click **"Set Up"**

## Step 3: Configure Instagram Webhooks

1. Go to **Webhooks** in the left sidebar
2. Select **"Instagram"** from the dropdown
3. Click **"Subscribe to this object"**
4. Enter:
   - **Callback URL**: `https://your-app.vercel.app/api/instagram-webhook`
   - **Verify Token**: `33d5bfdcd0883a553b84d65665a060fb86114db7af1676e18b0630d2a961fb5e`
5. Click **"Verify and Save"**
6. Subscribe to these fields:
   - `messages` - Receive DMs
   - `message_reactions` - Message reactions
   - `messaging_seen` - Read receipts
   - `messaging_postbacks` - Button clicks
   - `messaging_referrals` - Referral tracking

## Step 4: Configure App Settings

1. Go to **Settings** → **Basic**
2. Add:
   - **App Domains**: `your-app.vercel.app`
   - **Privacy Policy URL**: `https://your-app.vercel.app/privacy`
   - **Terms of Service URL**: `https://your-app.vercel.app/terms`

## Step 5: Get Your Credentials

From **Settings** → **Basic**, copy:
- **App ID**: Your Meta App ID
- **App Secret**: Your Meta App Secret (click "Show")

## Step 6: Set Up Environment Variables

In your Vercel dashboard or `.env.local`:

```env
# Meta App Configuration
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_WEBHOOK_VERIFY_TOKEN=33d5bfdcd0883a553b84d65665a060fb86114db7af1676e18b0630d2a961fb5e
META_GRAPH_API_VERSION=v20.0

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_APP_ID=your-app-id
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://your-app.vercel.app/auth/facebook-callback

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Encryption
APP_ENCRYPTION_KEY=your-32-byte-key
```

## Step 7: Configure Facebook Login

1. Go to **Facebook Login** → **Settings**
2. Add to **Valid OAuth Redirect URIs**:
   - `https://your-app.vercel.app/auth/facebook-callback`
   - `http://localhost:3000/auth/facebook-callback` (for development)
3. Save Changes

## Step 8: Set Permissions

The app requires these permissions for Instagram Messaging:

### Required Permissions:
- `instagram_basic` - Basic Instagram account info
- `instagram_manage_messages` - Send and receive DMs
- `pages_show_list` - List Facebook Pages
- `pages_manage_metadata` - Page metadata for webhooks

### Optional Permissions:
- `instagram_manage_comments` - For comment triggers
- `instagram_content_publish` - For publishing content
- `business_management` - For advanced features

## Step 9: Add Test Users (Development Mode)

1. Go to **App Roles** → **Roles**
2. Add test users who will test the app
3. They must accept the invitation via Facebook

## Step 10: Test the Integration

1. **Connect an Account**:
   - Click "Connect Instagram" in your app
   - Authorize the Facebook app
   - Select the Page with Instagram connected

2. **Test Webhook**:
   - Send a DM to your connected Instagram account
   - Check your logs for webhook events

3. **Test Sending**:
   - Reply to a message through your app
   - Verify it appears in Instagram

## Important Notes

### What NOT to Do:
- ❌ Don't use "Instagram Basic Display API" (deprecated, read-only)
- ❌ Don't call `/subscribed_apps` on Instagram user IDs
- ❌ Don't use Instagram Basic Display OAuth flow
- ❌ Don't request permissions you don't need

### Correct Approach:
- ✅ Use Messenger API for Instagram messaging
- ✅ Use Facebook Login for OAuth
- ✅ Configure webhooks in Meta App Dashboard
- ✅ Use Page Access Tokens

## Going Live (App Review)

When ready for production:

1. Complete **Business Verification**
2. Submit for **App Review** with:
   - Detailed screencast showing the flow
   - Test user credentials
   - Clear use case description
3. Request **Advanced Access** for permissions

## Troubleshooting

### "No Instagram account found"
- Ensure Instagram is Professional (Business/Creator)
- Verify Instagram is linked to Facebook Page
- Check that you admin the Page

### Webhook not receiving events
- Verify webhook URL is HTTPS
- Check verify token matches
- Ensure Instagram object is subscribed
- Confirm fields are selected

### Can't send messages
- Check `instagram_manage_messages` permission
- Verify Page Access Token is valid
- Ensure within 24-hour window

## Resources

- [Messenger Platform for Instagram](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Messaging Webhooks](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)

## Support

For issues specific to this implementation:
1. Check the [GitHub Issues](https://github.com/jors7/SocialInbox/issues)
2. Review webhook logs in Supabase Functions
3. Verify all environment variables are set correctly