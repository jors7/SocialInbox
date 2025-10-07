#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  GitHub Secrets Setup${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed!${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub first${NC}"
    echo "Running: gh auth login"
    gh auth login
fi

echo -e "${YELLOW}Setting up GitHub secrets for cron jobs...${NC}"
echo ""

# Load environment variables
if [ -f "apps/web/.env.local" ]; then
    echo "Loading environment variables from apps/web/.env.local"
    source apps/web/.env.local
else
    echo -e "${RED}No .env.local file found!${NC}"
    exit 1
fi

# Set secrets
echo "Setting SUPABASE_URL..."
echo "$SUPABASE_URL" | gh secret set SUPABASE_URL

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "$SUPABASE_SERVICE_ROLE_KEY" | gh secret set SUPABASE_SERVICE_ROLE_KEY

echo ""
echo -e "${GREEN}✓ GitHub secrets configured successfully!${NC}"
echo ""
echo -e "${YELLOW}Testing the cron job manually...${NC}"
gh workflow run daily-cron.yml

echo ""
echo -e "${GREEN}✓ Cron job triggered manually${NC}"
echo "Check the status at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo ""
echo -e "${YELLOW}The cron job will now run automatically every day at 3:00 AM UTC${NC}"
