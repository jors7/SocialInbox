# SocialInbox - Instagram DM Automation Platform

A ManyChat-style Instagram DM automation platform built with Next.js, Supabase, and TypeScript.

## Features

- 🎨 **Visual Flow Builder** - Drag-and-drop interface for creating conversation flows
- 💬 **Multi-Trigger Support** - Comment → DM, Story Reply → DM, @Mention → DM
- ⏰ **24-hour Window Compliance** - Automatic enforcement with Human Agent handover
- 🤖 **AI-Powered** - Flow generation, response suggestions, sentiment analysis
- 📊 **Analytics** - Funnel visualization, A/B testing, conversion tracking
- 🔌 **Integrations** - Shopify, email platforms, webhooks

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, React Flow
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **Queue System**: BullMQ for workflow orchestration
- **Monitoring**: Sentry, OpenTelemetry

## 🚀 Quick Start

**Get up and running in 3 commands:**

```bash
# 1. Set up environment variables
npm run setup:env

# 2. Deploy to Supabase
npm run deploy:supabase

# 3. Start development
npm run dev
```

📖 **Detailed guide:** See [QUICK_START.md](./QUICK_START.md) for step-by-step instructions.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account and project
- Meta Developer account
- Facebook App with Instagram Messaging permissions
- Instagram Business account connected to a Facebook Page

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/socialinbox.git
cd socialinbox
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (automated):
```bash
npm run setup:env
```

This will prompt you for:
- Supabase credentials
- Meta App ID and Secret
- Generate secure tokens automatically

4. Deploy to Supabase (automated):
```bash
npm run deploy:supabase
```

This will:
- Link to your Supabase project
- Deploy all Edge Functions
- Configure secrets

5. Start the development server:
```bash
npm run dev
```

6. Configure webhooks in Meta Dashboard using the URLs from the deployment output

## Project Structure

```
/apps
  /web              # Next.js frontend application
  /edge             # Supabase Edge Functions
/packages
  /shared           # Shared types, utilities, and schemas
  /ui               # Shared UI components
  /flow-engine      # Flow execution logic
/supabase
  /migrations       # Database migrations
  /functions        # Edge function source
```

## Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run test             # Run tests
npm run typecheck        # Type checking
npm run lint             # Run linter

# Database
npm run db:migrate       # Run database migrations
npm run db:types         # Generate TypeScript types

# Deployment
npm run setup:env        # Set up environment variables
npm run deploy:supabase  # Deploy Edge Functions
npm run check:config     # Verify configuration
```

## Setting Up Instagram Integration

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

**Quick overview:**

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram product with Facebook Login
3. Configure OAuth redirect URIs
4. Set up webhooks with callback URL from deployment
5. Add required permissions for Instagram Messaging

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deploy

```bash
# Deploy Edge Functions to Supabase
npm run deploy:supabase

# Deploy frontend to Vercel
vercel --prod
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@socialinbox.com or join our Discord community.