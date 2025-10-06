#!/bin/bash

# SocialInbox - Configuration Check Script
# Verifies that all required environment variables and services are configured

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}SocialInbox Configuration Check${NC}"
echo -e "${BLUE}================================${NC}\n"

ENV_FILE="apps/web/.env.local"
ERRORS=0
WARNINGS=0

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ $ENV_FILE not found${NC}"
    echo -e "${YELLOW}Run 'npm run setup:env' to create it${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}\n"

# Load environment variables
source "$ENV_FILE"

# Function to check variable
check_var() {
    local var_name=$1
    local var_value="${!var_name}"
    local is_required=${2:-true}
    local min_length=${3:-1}

    if [ -z "$var_value" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}✗ $var_name is not set${NC}"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠ $var_name is not set (optional)${NC}"
            ((WARNINGS++))
        fi
        return 1
    elif [ ${#var_value} -lt $min_length ]; then
        echo -e "${RED}✗ $var_name is too short (min $min_length chars)${NC}"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓ $var_name is set${NC}"
        return 0
    fi
}

# Check Supabase Configuration
echo -e "${YELLOW}=== Supabase Configuration ===${NC}\n"

check_var "NEXT_PUBLIC_SUPABASE_URL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" true 20
check_var "SUPABASE_SERVICE_ROLE_KEY" true 20

echo ""

# Check Meta App Configuration
echo -e "${YELLOW}=== Meta App Configuration ===${NC}\n"

check_var "META_APP_ID"
check_var "NEXT_PUBLIC_FACEBOOK_APP_ID"
check_var "META_APP_SECRET" true 20

# Check if they match
if [ "$META_APP_ID" != "$NEXT_PUBLIC_FACEBOOK_APP_ID" ]; then
    echo -e "${YELLOW}⚠ META_APP_ID and NEXT_PUBLIC_FACEBOOK_APP_ID should be the same${NC}"
    ((WARNINGS++))
fi

echo ""

# Check Security Tokens
echo -e "${YELLOW}=== Security Configuration ===${NC}\n"

check_var "META_WEBHOOK_VERIFY_TOKEN" true 32
check_var "APP_ENCRYPTION_KEY" true 32

# Check if encryption key is hex
if [[ ! "$APP_ENCRYPTION_KEY" =~ ^[0-9a-fA-F]+$ ]]; then
    echo -e "${YELLOW}⚠ APP_ENCRYPTION_KEY should be hexadecimal${NC}"
    ((WARNINGS++))
fi

echo ""

# Check App URLs
echo -e "${YELLOW}=== Application URLs ===${NC}\n"

check_var "NEXT_PUBLIC_APP_URL"

# Check if URL is valid
if [[ ! "$NEXT_PUBLIC_APP_URL" =~ ^https?:// ]]; then
    echo -e "${YELLOW}⚠ NEXT_PUBLIC_APP_URL should start with http:// or https://${NC}"
    ((WARNINGS++))
fi

check_var "META_GRAPH_API_VERSION" false

echo ""

# Check Supabase CLI
echo -e "${YELLOW}=== Supabase CLI ===${NC}\n"

if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓ Supabase CLI installed${NC}"

    # Check if logged in
    if supabase projects list &> /dev/null; then
        echo -e "${GREEN}✓ Logged in to Supabase${NC}"

        # Check if project is linked
        if supabase status &> /dev/null 2>&1; then
            PROJECT_REF=$(supabase status 2>/dev/null | grep "Project ref:" | awk '{print $3}' || echo "")
            if [ -n "$PROJECT_REF" ]; then
                echo -e "${GREEN}✓ Project linked: $PROJECT_REF${NC}"

                # Display webhook URL
                echo -e "\n${BLUE}Your webhook URL:${NC}"
                echo -e "${GREEN}https://${PROJECT_REF}.supabase.co/functions/v1/instagram-webhook${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Project not linked${NC}"
            echo -e "  Run: supabase link --project-ref YOUR-PROJECT-REF"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠ Not logged in to Supabase${NC}"
        echo -e "  Run: supabase login"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗ Supabase CLI not installed${NC}"
    echo -e "  Install: brew install supabase/tap/supabase"
    ((ERRORS++))
fi

echo ""

# Check Node.js version
echo -e "${YELLOW}=== Node.js Environment ===${NC}\n"

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)

if [ "$NODE_MAJOR" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js $NODE_VERSION (>= 18 required)${NC}"
else
    echo -e "${RED}✗ Node.js $NODE_VERSION (>= 18 required)${NC}"
    ((ERRORS++))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm $NPM_VERSION installed${NC}"
else
    echo -e "${RED}✗ npm not installed${NC}"
    ((ERRORS++))
fi

echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Configuration Check Summary${NC}"
echo -e "${BLUE}================================${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}Your configuration looks good.${NC}\n"

    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run 'npm run deploy:supabase' to deploy Edge Functions"
    echo "2. Configure webhooks in Meta App Dashboard"
    echo "3. Run 'npm run dev' to start development"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Configuration has $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}You can proceed but may want to review the warnings above.${NC}\n"
    exit 0
else
    echo -e "${RED}✗ Configuration has $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo -e "${RED}Please fix the errors above before proceeding.${NC}\n"

    echo -e "${YELLOW}Common fixes:${NC}"
    echo "- Run 'npm run setup:env' to configure environment"
    echo "- Check your Supabase dashboard for correct credentials"
    echo "- Verify Meta App ID and Secret from Meta Developer Dashboard"
    echo ""
    exit 1
fi
