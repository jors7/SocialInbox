# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SocialInbox is a ManyChat-style Instagram DM automation platform that allows users to connect their Instagram accounts for complete direct message automation. The project will expand to support Facebook Messenger, WhatsApp, and other platforms.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Flow (visual builder), Framer Motion, TanStack Query
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime, Storage), Redis (caching/rate limiting)
- **Queue System**: Custom queue implementation with PostgreSQL and Edge Functions
- **Worker Service**: Node.js with cron for queue processing
- **Monitoring**: Built-in queue dashboard, Sentry, OpenTelemetry
- **AI**: OpenAI/Anthropic integration for intelligent features

### Key Features
1. **Visual Flow Builder**: Drag-and-drop interface for creating conversation flows
2. **Multi-trigger Support**: Comment → DM, Story Reply → DM, @Mention → DM
3. **24-hour Window Compliance**: Automatic enforcement with Human Agent handover
4. **AI-Powered**: Flow generation, response suggestions, sentiment analysis
5. **Analytics**: Funnel visualization, A/B testing, conversion tracking
6. **Integrations**: Shopify, email platforms, webhooks

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Start the queue worker (in a separate terminal)
cd apps/worker && npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Database migrations
npm run db:migrate

# Generate types from Supabase
npm run db:types

# Kill all dev servers (if needed)
# On macOS/Linux:
pkill -f "next dev" && pkill -f "supabase" && pkill -f "turbo"

# On Windows:
# taskkill /F /IM "node.exe" /T
```

## Project Structure

```
/apps
  /web              # Next.js frontend application
  /worker           # Queue processing worker service
/packages
  /shared           # Shared types, utilities, and schemas
  /ui               # Shared UI components
  /flow-engine      # Flow execution logic
/supabase
  /migrations       # Database migrations
  /functions        # Edge function source
    /connect-instagram    # OAuth and webhook setup
    /instagram-webhook    # Webhook handler
    /queue-processor      # Queue processing logic
    /cron-scheduler       # Scheduled tasks
```

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
- Project setup with monorepo structure
- Visual flow builder with React Flow
- Instagram webhook integration
- Basic triggers (comment, story reply, mention)
- 24-hour window enforcement
- Live inbox with real-time updates
- Basic analytics

### Phase 2: Advanced Features (Weeks 5-8)
- AI integration for flow generation
- Advanced analytics with A/B testing
- Integration hub (Shopify, email platforms)
- User attributes and segmentation
- Template marketplace

### Phase 3: Scale & Multi-Channel (Weeks 9-12)
- WhatsApp and Facebook Messenger support
- Enterprise features (RBAC, white-label)
- Performance optimization
- Monitoring and observability

## Queue System

The application uses a robust queue system for background processing:

### Queue Types
1. **Flow Executions Queue** (`flow_executions`)
   - Processes automation flows step by step
   - Handles delays, conditions, and user input collection
   - Supports retry logic and error handling

2. **Message Queue** (`message_queue`)
   - Queues outgoing Instagram messages
   - Ensures proper delivery with retry logic
   - Tracks sent/failed status

3. **API Queue** (`api_queue`)
   - Manages rate-limited API calls to Instagram
   - Implements priority-based processing
   - Automatic rate limit detection and backoff

### Features
- **Rate Limiting**: Respects Instagram API limits (200 requests/hour)
- **Retry Logic**: Automatic retries with exponential backoff
- **Priority Processing**: High-priority messages processed first
- **Real-time Monitoring**: Dashboard at `/dashboard/queue`
- **Health Checks**: Automatic detection of stuck executions
- **Cleanup**: Daily cleanup of old processed items

### Running the Worker
```bash
cd apps/worker
npm run dev  # Development
npm run build && npm start  # Production
```

## Database Schema

Key tables:
- `teams`: Multi-tenancy support
- `ig_accounts`: Connected Instagram accounts with encrypted tokens
- `contacts`: User profiles and attributes
- `conversations`: Thread management with 24-hour windows
- `messages`: Message history with delivery status
- `flow_executions`: Queue for flow processing
- `message_queue`: Queue for outgoing messages
- `api_queue`: Queue for rate-limited API calls
- `rate_limits`: Tracking API usage per account
- `flows`: Visual flow definitions
- `triggers`: Automation triggers configuration
- `flow_templates`: Pre-built flow templates

## API Rate Limits

Instagram API limits:
- 200 calls per user per hour
- 60 writes per user per hour for comments
- Message rate: 200 messages per conversation per hour

Implement rate limiting with Redis and exponential backoff.

## Security Considerations

1. Token encryption using pgcrypto
2. Row Level Security (RLS) on all tables
3. Team-based access control
4. Secure webhook verification
5. Environment variable management for secrets

## Testing Strategy

1. Unit tests for flow engine logic
2. Integration tests for API endpoints
3. E2E tests with Playwright
4. Load testing for queue system
5. Security testing for authentication

## Deployment

1. Frontend: Vercel or Railway
2. Backend: Supabase hosted
3. Redis: Upstash or Redis Cloud
4. Monitoring: Sentry + Grafana Cloud

## Common Development Tasks

### Adding a New Flow Node Type
1. Define node schema in `/packages/shared/schemas/nodes.ts`
2. Create React component in `/apps/web/components/flow-builder/nodes/`
3. Add execution logic in `/packages/flow-engine/executors/`
4. Update flow validation logic

### Adding a New Integration
1. Create connector in `/packages/shared/integrations/`
2. Add OAuth flow if needed
3. Create webhook handlers in Edge Functions
4. Add to integration UI in settings

### Debugging Webhook Issues
1. Check `/supabase/functions/logs` for Edge Function logs
2. Verify webhook signature in `meta-webhook` function
3. Check `events_inbox` table for raw payloads
4. Monitor queue processing in BullMQ dashboard

## Performance Optimization

1. Use React.memo and useMemo for flow builder
2. Implement virtual scrolling for large message lists
3. Cache flow definitions in Redis
4. Batch API calls where possible
5. Use database indexes on frequently queried fields

## Monitoring and Alerts

Set up alerts for:
- API rate limit approaching (80% threshold)
- Queue depth exceeding threshold
- Failed message delivery rate > 5%
- 24-hour window violations
- Error rate spikes