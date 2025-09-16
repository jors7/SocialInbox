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

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase CLI
- Facebook App with Instagram Messaging permissions

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

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Initialize Supabase:
```bash
npx supabase init
npx supabase start
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Seed the database:
```bash
npx supabase db seed
```

7. Start the development server:
```bash
npm run dev
```

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

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Setting Up Instagram Integration

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Messaging product to your app
3. Configure webhook URL: `https://your-domain.com/api/webhooks/meta`
4. Subscribe to webhook fields: messages, messaging_postbacks, message_reactions
5. Generate long-lived access tokens for Instagram accounts

## Deployment

### Vercel (Frontend)
```bash
vercel --prod
```

### Supabase (Backend)
```bash
npx supabase functions deploy
npx supabase db push
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@socialinbox.com or join our Discord community.