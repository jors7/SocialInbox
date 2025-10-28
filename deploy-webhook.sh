#!/bin/bash

# Deploy instagram-webhook function
# Usage: ./deploy-webhook.sh YOUR_SUPABASE_ACCESS_TOKEN

if [ -z "$1" ]; then
  echo "Error: Supabase access token required"
  echo "Usage: ./deploy-webhook.sh YOUR_SUPABASE_ACCESS_TOKEN"
  echo ""
  echo "Get your token from: https://supabase.com/dashboard/account/tokens"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN=$1

echo "Deploying instagram-webhook..."
supabase functions deploy instagram-webhook

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
else
  echo "❌ Deployment failed"
  exit 1
fi
