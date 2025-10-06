#!/bin/bash

# SocialInbox - Environment Setup Script
# This script helps set up your .env.local file with all required variables

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}SocialInbox Environment Setup${NC}"
echo -e "${BLUE}================================${NC}\n"

ENV_FILE="apps/web/.env.local"

# Check if .env.local already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: $ENV_FILE already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    # Backup existing file
    cp "$ENV_FILE" "$ENV_FILE.backup"
    echo -e "${GREEN}Backup created: $ENV_FILE.backup${NC}\n"
fi

# Create .env.local from template
if [ -f "apps/web/.env.local.example" ]; then
    cp apps/web/.env.local.example "$ENV_FILE"
    echo -e "${GREEN}Created $ENV_FILE from template${NC}\n"
else
    touch "$ENV_FILE"
fi

echo -e "${YELLOW}Let's configure your environment variables...${NC}\n"

# Function to prompt for variable
prompt_var() {
    local var_name=$1
    local description=$2
    local default_value=$3
    local is_secret=${4:-false}

    echo -e "${BLUE}$var_name${NC}"
    echo "$description"

    if [ -n "$default_value" ]; then
        read -p "Enter value (default: $default_value): " value
        value=${value:-$default_value}
    else
        if [ "$is_secret" = true ]; then
            read -sp "Enter value: " value
            echo
        else
            read -p "Enter value: " value
        fi
    fi

    # Update or append to .env.local
    if grep -q "^${var_name}=" "$ENV_FILE" 2>/dev/null; then
        # Use different sed syntax for macOS vs Linux
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${var_name}=.*|${var_name}=${value}|" "$ENV_FILE"
        else
            sed -i "s|^${var_name}=.*|${var_name}=${value}|" "$ENV_FILE"
        fi
    else
        echo "${var_name}=${value}" >> "$ENV_FILE"
    fi

    echo -e "${GREEN}✓ $var_name set${NC}\n"
}

# Supabase Configuration
echo -e "${YELLOW}=== Supabase Configuration ===${NC}\n"

prompt_var "NEXT_PUBLIC_SUPABASE_URL" \
    "Your Supabase project URL (found in Project Settings → API)" \
    ""

prompt_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "Your Supabase anon/public key (found in Project Settings → API)" \
    ""

prompt_var "SUPABASE_SERVICE_ROLE_KEY" \
    "Your Supabase service role key (found in Project Settings → API)" \
    "" \
    true

# Meta App Configuration
echo -e "${YELLOW}=== Meta App Configuration ===${NC}\n"

prompt_var "META_APP_ID" \
    "Your Meta App ID (found in Meta App Dashboard → Settings → Basic)" \
    ""

prompt_var "NEXT_PUBLIC_FACEBOOK_APP_ID" \
    "Same as META_APP_ID (for frontend)" \
    "$META_APP_ID"

prompt_var "META_APP_SECRET" \
    "Your Meta App Secret (found in Meta App Dashboard → Settings → Basic)" \
    "" \
    true

# Generate tokens
echo -e "${YELLOW}=== Generating Security Tokens ===${NC}\n"

echo "Generating webhook verify token..."
WEBHOOK_TOKEN=$(openssl rand -hex 32)
if grep -q "^META_WEBHOOK_VERIFY_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^META_WEBHOOK_VERIFY_TOKEN=.*|META_WEBHOOK_VERIFY_TOKEN=${WEBHOOK_TOKEN}|" "$ENV_FILE"
    else
        sed -i "s|^META_WEBHOOK_VERIFY_TOKEN=.*|META_WEBHOOK_VERIFY_TOKEN=${WEBHOOK_TOKEN}|" "$ENV_FILE"
    fi
else
    echo "META_WEBHOOK_VERIFY_TOKEN=${WEBHOOK_TOKEN}" >> "$ENV_FILE"
fi
echo -e "${GREEN}✓ Generated META_WEBHOOK_VERIFY_TOKEN${NC}"
echo -e "${BLUE}Token: ${WEBHOOK_TOKEN}${NC}\n"

echo "Generating encryption key..."
ENCRYPTION_KEY=$(openssl rand -hex 32)
if grep -q "^APP_ENCRYPTION_KEY=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^APP_ENCRYPTION_KEY=.*|APP_ENCRYPTION_KEY=${ENCRYPTION_KEY}|" "$ENV_FILE"
    else
        sed -i "s|^APP_ENCRYPTION_KEY=.*|APP_ENCRYPTION_KEY=${ENCRYPTION_KEY}|" "$ENV_FILE"
    fi
else
    echo "APP_ENCRYPTION_KEY=${ENCRYPTION_KEY}" >> "$ENV_FILE"
fi
echo -e "${GREEN}✓ Generated APP_ENCRYPTION_KEY${NC}\n"

# App URLs
echo -e "${YELLOW}=== Application URLs ===${NC}\n"

prompt_var "NEXT_PUBLIC_APP_URL" \
    "Your application URL (use http://localhost:3000 for development)" \
    "http://localhost:3000"

# Set API version
if grep -q "^META_GRAPH_API_VERSION=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^META_GRAPH_API_VERSION=.*|META_GRAPH_API_VERSION=v20.0|" "$ENV_FILE"
    else
        sed -i "s|^META_GRAPH_API_VERSION=.*|META_GRAPH_API_VERSION=v20.0|" "$ENV_FILE"
    fi
else
    echo "META_GRAPH_API_VERSION=v20.0" >> "$ENV_FILE"
fi

# Summary
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Environment Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${BLUE}Configuration saved to: ${ENV_FILE}${NC}\n"

echo -e "${YELLOW}Important values to save:${NC}"
echo -e "Webhook Verify Token: ${GREEN}${WEBHOOK_TOKEN}${NC}"
echo -e "Encryption Key: ${GREEN}${ENCRYPTION_KEY}${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review your $ENV_FILE file"
echo "2. Run 'npm run deploy:supabase' to deploy Edge Functions"
echo "3. Configure webhooks in Meta App Dashboard using the token above"
echo "4. Start development with 'npm run dev'"
echo ""

echo -e "${GREEN}Setup complete!${NC}"
