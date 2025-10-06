# SocialInbox - Quick Start Guide

Get your SocialInbox installation up and running in minutes!

## 🚀 One-Command Setup

```bash
# 1. Set up environment variables
npm run setup:env

# 2. Deploy to Supabase
npm run deploy:supabase

# 3. Start development
npm run dev
```

## 📋 What You'll Need

Before running the setup scripts, have these ready:

### From Supabase Dashboard
- Project URL
- Anon (public) key
- Service role key

**Where to find:** Supabase Dashboard → Project Settings → API

### From Meta Developer Dashboard
- App ID
- App Secret

**Where to find:** Meta Dashboard → Your App → Settings → Basic

## 🔧 Setup Steps

### Step 1: Environment Setup (2 minutes)

```bash
npm run setup:env
```

This will:
- Prompt you for Supabase credentials
- Prompt you for Meta App credentials
- Generate secure random tokens
- Create `apps/web/.env.local` file

**Save these generated values:**
- `META_WEBHOOK_VERIFY_TOKEN` - You'll need this for Meta webhook configuration
- `APP_ENCRYPTION_KEY` - Keep this secure!

### Step 2: Deploy to Supabase (3 minutes)

```bash
npm run deploy:supabase
```

This will:
- Login to Supabase
- Link to your project
- Deploy all Edge Functions
- Configure secrets
- Show you your webhook URLs

**Copy this webhook URL** for the next step:
```
https://YOUR-PROJECT.supabase.co/functions/v1/instagram-webhook
```

### Step 3: Configure Meta App (5 minutes)

#### A. Facebook Login Settings

Go to: Meta Dashboard → Products → Facebook Login → Settings

Add to **Valid OAuth Redirect URIs**:
```
http://localhost:3000/auth/facebook-callback
https://yourdomain.com/auth/facebook-callback
```

Enable:
- ✅ Client OAuth Login
- ✅ Web OAuth Login
- ✅ Enforce HTTPS

#### B. Privacy URLs

Go to: Meta Dashboard → Settings → Basic

**Deauthorize Callback:**
```
https://yourdomain.com/api/auth/deauthorize
```

**Data Deletion Request:**
```
https://yourdomain.com/api/auth/data-deletion
```

#### C. Webhook Configuration

Go to: Meta Dashboard → Products → Webhooks → Instagram

Click **"Edit Subscription"** or **"Configure Webhooks"**

**Callback URL:**
```
https://YOUR-PROJECT.supabase.co/functions/v1/instagram-webhook
```

**Verify Token:**
- Use the token from Step 1 output

**Subscribe to:**
- ✅ messages
- ✅ messaging_postbacks
- ✅ message_echoes

Click **"Verify and Save"**

#### D. Permissions

Go to: Meta Dashboard → API setup with Facebook login

Click these buttons:
1. **"Add required content permissions"**
2. **"Add required messaging permissions"**

### Step 4: Run Database Migrations (1 minute)

```bash
npm run db:migrate
```

Or if using remote Supabase:
```bash
supabase db push
```

### Step 5: Start Development (1 minute)

```bash
npm run dev
```

Open http://localhost:3000

## ✅ Test Your Setup

### Test OAuth Connection:

1. Go to `/dashboard/connections`
2. Click "Connect Instagram Account"
3. Complete Facebook OAuth
4. See your account appear in the dashboard

### Test Webhooks:

1. Send a DM to your Instagram Business account
2. Check it appears in your inbox
3. View logs: `supabase functions logs instagram-webhook --tail`

## 🆘 Troubleshooting

### "Webhook verification failed"
- Check verify token matches exactly
- Ensure webhook URL is correct
- Check Edge Function logs

### "OAuth redirect URI mismatch"
- Verify URIs in Meta settings match exactly
- Include both localhost and production URLs

### "No Instagram account found"
- Ensure Instagram is a Business/Creator account
- Verify it's connected to a Facebook Page
- Check if user granted all permissions

## 📚 Next Steps

- ✅ Connected Instagram? Create your first automation flow!
- ✅ Set up triggers for comments and story replies
- ✅ Customize your bot responses
- ✅ Review analytics

## 📖 Full Documentation

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🔑 Important Files

- `apps/web/.env.local` - Your environment variables (never commit!)
- `.meta-webhook-token` - Your webhook verify token (never commit!)
- `DEPLOYMENT_GUIDE.md` - Full deployment documentation
- `package.json` - Available npm scripts

## 💡 Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run dev:web          # Start only web app

# Database
npm run db:migrate       # Run migrations
npm run db:types         # Generate TypeScript types

# Deployment
npm run setup:env        # Set up environment
npm run deploy:supabase  # Deploy Edge Functions

# Code Quality
npm run typecheck        # Type checking
npm run lint             # Linting
npm run test             # Run tests
```

---

**Need help?** Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or create an issue on GitHub.
