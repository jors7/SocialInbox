# Test Flow Setup Instructions

## Step 1: Create Test Flow

Go to: https://supabase.com/dashboard/project/uznzejmekcgwgtilbzby/sql/new

Run this SQL:

```sql
-- Create test flow
INSERT INTO public.flows (team_id, name, spec, is_active)
SELECT
  t.id as team_id,
  'Test Auto-Reply Flow',
  '{
    "nodes": {
      "start": {
        "id": "start",
        "type": "start",
        "data": {}
      },
      "message_1": {
        "id": "message_1",
        "type": "message",
        "data": {
          "text": "Hi! Thanks for messaging us. How can we help you today?"
        }
      }
    },
    "edges": [
      {
        "id": "start_to_message",
        "source": "start",
        "target": "message_1"
      }
    ]
  }'::jsonb,
  true
FROM public.teams t
LIMIT 1
RETURNING id;
```

**Important:** Copy the returned flow `id` - you'll need it for Step 2!

---

## Step 2: Create Trigger

Replace `<FLOW_ID_FROM_STEP_1>` with the actual ID from Step 1:

```sql
INSERT INTO public.triggers (team_id, ig_account_id, trigger_type, filters, flow_id, is_active)
SELECT
  t.id as team_id,
  ig.id as ig_account_id,
  'direct_message',
  '{"include_keywords": ["hello", "hi"]}'::jsonb,
  '<FLOW_ID_FROM_STEP_1>',
  true
FROM public.teams t
JOIN public.ig_accounts ig ON ig.team_id = t.id
LIMIT 1;
```

---

## Step 3: Test the Flow

### A. Send Test Message
From a **different Instagram account** (not owned by the same Facebook user), send a DM to **@thejanorsula** with the text:
```
hello
```

### B. Check if Webhook Received It
```bash
curl https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/check-webhook-logs \
  -H "Authorization: Bearer sb_publishable_mcm7O98OaokMBzAHGfb18w_Y-L2rjDA"
```

### C. Check if Flow Was Queued
Go to: https://supabase.com/dashboard/project/uznzejmekcgwgtilbzby/editor

Run this SQL:
```sql
SELECT * FROM flow_executions ORDER BY started_at DESC LIMIT 5;
```

### D. Manually Trigger Queue Processor (for immediate testing)
```bash
curl -X POST https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/process-queues \
  -H "Authorization: Bearer sb_secret_6qnQtnPkx2GAng4cnTHC2Q_ZAYnW2Vi"
```

### E. Check if Reply Was Sent
```sql
SELECT * FROM messages WHERE direction = 'out' ORDER BY created_at DESC LIMIT 5;
```

### F. Verify on Instagram
Check the Instagram DM thread - you should see the auto-reply!

---

## Troubleshooting

If something doesn't work:

1. **Check webhook logs:**
   ```bash
   curl https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/check-webhook-logs \
     -H "Authorization: Bearer sb_publishable_mcm7O98OaokMBzAHGfb18w_Y-L2rjDA"
   ```

2. **Check flow executions:**
   ```sql
   SELECT id, status, context FROM flow_executions ORDER BY started_at DESC LIMIT 3;
   ```

3. **Check messages:**
   ```sql
   SELECT id, direction, delivery_status, payload FROM messages ORDER BY created_at DESC LIMIT 5;
   ```

4. **Check Edge Function logs:**
   - Go to: https://supabase.com/dashboard/project/uznzejmekcgwgtilbzby/logs/edge-functions
   - Filter by function: queue-processor or process-queues
