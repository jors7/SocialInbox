#!/bin/bash

# SocialInbox - Supabase Deployment Script
# This script automates the deployment of Edge Functions and configuration

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}SocialInbox Supabase Deployment${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Step 1: Login to Supabase
echo -e "${YELLOW}Step 1: Logging in to Supabase...${NC}"
if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✓ Already logged in${NC}\n"
else
    echo "Please login to Supabase:"
    supabase login
    echo ""
fi

# Step 2: Check if project is linked
echo -e "${YELLOW}Step 2: Checking project link...${NC}"
if supabase status &> /dev/null; then
    PROJECT_REF=$(supabase status | grep "Project ref:" | awk '{print $3}')
    echo -e "${GREEN}✓ Project linked: ${PROJECT_REF}${NC}\n"
else
    echo -e "${YELLOW}Project not linked. Please enter your Supabase project reference ID:${NC}"
    echo "(Find it in your Supabase dashboard under Settings > General > Reference ID)"
    read -p "Project Ref: " PROJECT_REF

    echo "Linking to project..."
    supabase link --project-ref "$PROJECT_REF"
    echo -e "${GREEN}✓ Project linked successfully${NC}\n"
fi

# Step 3: Set up environment secrets
echo -e "${YELLOW}Step 3: Setting up Edge Function secrets...${NC}"
echo ""

# Check if .env.local exists
if [ -f "apps/web/.env.local" ]; then
    echo "Found .env.local file. Loading environment variables..."
    source apps/web/.env.local
else
    echo -e "${YELLOW}No .env.local found. You'll need to enter values manually.${NC}"
fi

# META_APP_ID
if [ -z "$META_APP_ID" ]; then
    read -p "Enter META_APP_ID: " META_APP_ID
fi
echo "Setting META_APP_ID..."
supabase secrets set META_APP_ID="$META_APP_ID" --project-ref "$PROJECT_REF"

# META_APP_SECRET
if [ -z "$META_APP_SECRET" ]; then
    read -p "Enter META_APP_SECRET: " META_APP_SECRET
fi
echo "Setting META_APP_SECRET..."
supabase secrets set META_APP_SECRET="$META_APP_SECRET" --project-ref "$PROJECT_REF"

# META_WEBHOOK_VERIFY_TOKEN
if [ -z "$META_WEBHOOK_VERIFY_TOKEN" ]; then
    echo "Generating random webhook verify token..."
    META_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 32)
    echo -e "${GREEN}Generated token: ${META_WEBHOOK_VERIFY_TOKEN}${NC}"
    echo -e "${YELLOW}IMPORTANT: Save this token! You'll need it for Meta webhook configuration.${NC}"
    echo "$META_WEBHOOK_VERIFY_TOKEN" > .meta-webhook-token
    echo -e "Token saved to .meta-webhook-token\n"
fi
echo "Setting META_WEBHOOK_VERIFY_TOKEN..."
supabase secrets set META_WEBHOOK_VERIFY_TOKEN="$META_WEBHOOK_VERIFY_TOKEN" --project-ref "$PROJECT_REF"

# META_GRAPH_API_VERSION
META_GRAPH_API_VERSION=${META_GRAPH_API_VERSION:-"v20.0"}
echo "Setting META_GRAPH_API_VERSION to $META_GRAPH_API_VERSION..."
supabase secrets set META_GRAPH_API_VERSION="$META_GRAPH_API_VERSION" --project-ref "$PROJECT_REF"

# APP_ENCRYPTION_KEY
if [ -z "$APP_ENCRYPTION_KEY" ]; then
    echo "Generating encryption key..."
    APP_ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo -e "${GREEN}Generated encryption key: ${APP_ENCRYPTION_KEY}${NC}"
    echo -e "${YELLOW}IMPORTANT: Save this key in your .env.local file!${NC}"
fi
echo "Setting APP_ENCRYPTION_KEY..."
supabase secrets set APP_ENCRYPTION_KEY="$APP_ENCRYPTION_KEY" --project-ref "$PROJECT_REF"

# META_VERIFY_TOKEN (for backwards compatibility with meta-webhook)
echo "Setting META_VERIFY_TOKEN (alias)..."
supabase secrets set META_VERIFY_TOKEN="$META_WEBHOOK_VERIFY_TOKEN" --project-ref "$PROJECT_REF"

echo -e "${GREEN}✓ All secrets configured${NC}\n"

# Step 4: Deploy Edge Functions
echo -e "${YELLOW}Step 4: Deploying Edge Functions...${NC}\n"

FUNCTIONS=(
    "connect-instagram"
    "instagram-webhook"
    "meta-webhook"
    "process-event"
    "send-message"
    "queue-processor"
    "cron-scheduler"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo -e "${BLUE}Deploying $func...${NC}"
        supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt
        echo -e "${GREEN}✓ $func deployed${NC}\n"
    else
        echo -e "${YELLOW}⊘ $func directory not found, skipping${NC}\n"
    fi
done

# Step 5: Display webhook URLs
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${BLUE}Your webhook URLs:${NC}"
echo -e "Instagram Webhook: ${GREEN}https://${PROJECT_REF}.supabase.co/functions/v1/instagram-webhook${NC}"
echo -e "Meta Webhook: ${GREEN}https://${PROJECT_REF}.supabase.co/functions/v1/meta-webhook${NC}"
echo ""

echo -e "${BLUE}Webhook Verify Token:${NC}"
echo -e "${GREEN}${META_WEBHOOK_VERIFY_TOKEN}${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Go to Meta App Dashboard → Products → Webhooks"
echo "2. Click 'Edit Subscription' for Instagram"
echo "3. Enter Callback URL: https://${PROJECT_REF}.supabase.co/functions/v1/instagram-webhook"
echo "4. Enter Verify Token: ${META_WEBHOOK_VERIFY_TOKEN}"
echo "5. Subscribe to these fields:"
echo "   - messages"
echo "   - messaging_postbacks"
echo "   - message_echoes"
echo "   - messaging_handovers"
echo ""

echo -e "${GREEN}OAuth Callback URLs (already configured in your app):${NC}"
echo "   - https://your-domain.com/auth/facebook-callback"
echo "   - https://your-domain.com/api/auth/deauthorize"
echo "   - https://your-domain.com/api/auth/data-deletion"
echo ""

echo -e "${BLUE}Deployment script completed successfully!${NC}"
