# Development Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the web app only** (recommended for development)
   ```bash
   npm run dev:web
   ```
   
   The app will be available at http://localhost:3000

3. **Run all services** (includes worker)
   ```bash
   npm run dev:all
   ```

## Available Scripts

- `npm run dev:web` - Run just the Next.js web app
- `npm run dev:all` - Run web app + worker (for queue processing)
- `npm run build` - Build all packages
- `npm run lint` - Run linting
- `npm run typecheck` - Run type checking

## Development Tips

### 1. Environment Variables
Create `apps/web/.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Without Supabase
The app will show connection errors but you can still:
- View the UI and navigate pages
- See the flow builder interface
- Explore the dashboard layout

### 3. Worker Service
The worker is optional for development. It processes:
- Message queues
- Flow executions
- Scheduled broadcasts

You only need it when testing:
- Automated message sending
- Flow executions
- Scheduled campaigns

## Common Issues

### Port Already in Use
If you see "address already in use :3000":
```bash
# Find the process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Worker Errors
The worker requires Supabase connection. If you see worker errors:
1. You can ignore them for UI development
2. Or add worker environment variables:
   ```bash
   # Create apps/worker/.env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Next Steps

1. Set up Supabase: `./scripts/setup-supabase.sh`
2. Configure Facebook app for Instagram integration
3. Deploy to Vercel: `./scripts/setup-vercel.sh`