#!/bin/bash

echo "🔐 Setting up Vercel Environment Variables"
echo "========================================="
echo ""

# Your Supabase credentials from .env.local
SUPABASE_URL="https://uznzejmekcgwgtilbzby.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bnplam1la2Nnd2d0aWxiemJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjQ4MzMsImV4cCI6MjA3NDMwMDgzM30.m3dh_yb7oyGCWt6hjiHKW9452ZX3cKybk-F1RBdXRrU"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bnplam1la2Nnd2d0aWxiemJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcyNDgzMywiZXhwIjoyMDc0MzAwODMzfQ.RUzEEq2EkgvL0a_apoF9wnyevAHBVniu9SMdyq6qIzM"

# Generate new encryption key for production
ENCRYPTION_KEY=$(openssl rand -hex 16)

echo "Setting environment variables..."
echo ""

# Set each variable for production, development, and preview
echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview

echo "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY development
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview

echo "Setting ENCRYPTION_KEY..."
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY production
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY development
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY preview

echo ""
echo "✅ Environment variables set!"
echo ""
echo "Generated encryption key: $ENCRYPTION_KEY"
echo "(Saved to Vercel, keep this secure if you need it elsewhere)"
echo ""
echo "You can view all variables with: vercel env ls"