#!/bin/bash

# Script to deploy webhook functions without JWT verification
# These functions need to accept requests from external services (Meta/Instagram)
# that don't have Supabase JWT tokens

set -e

echo "Deploying webhook functions without JWT verification..."

# Set the access token
export SUPABASE_ACCESS_TOKEN=sbp_b538773375cf4150acde0d3bd26e6d9d0db0e1ee

# Deploy instagram-webhook without JWT verification
echo ""
echo "Deploying instagram-webhook..."
supabase functions deploy instagram-webhook --no-verify-jwt

# Deploy cron-scheduler without JWT verification (for cron-job.org)
echo ""
echo "Deploying cron-scheduler..."
supabase functions deploy cron-scheduler --no-verify-jwt

echo ""
echo "✅ All webhook functions deployed successfully!"
echo ""
echo "Functions deployed without JWT verification:"
echo "  - instagram-webhook"
echo "  - cron-scheduler"
echo ""
echo "These functions can now accept requests from external services."
