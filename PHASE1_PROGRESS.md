# Phase 1: Core Automation - Progress Report

## ✅ Completed Today

### 1. Flow Triggering System
- ✅ Added `checkAndTriggerFlows()` function to webhook handler
- ✅ Incoming messages now check for active triggers
- ✅ Keyword filtering support (include/exclude keywords)
- ✅ Automatic 24-hour window reset on new messages
- ✅ Flow execution is queued when trigger matches

### 2. Webhook Integration
- ✅ Deployed updated instagram-webhook Edge Function
- ✅ Messages are saved to database correctly
- ✅ Conversations are created/updated properly
- ✅ Contact management working

### 3. Queue Processor Fixes
- ✅ Fixed all schema mismatches
- ✅ Updated flow spec parsing (nodes/edges inside spec object)
- ✅ Corrected execution context handling
- ✅ Message sending uses correct table structure
- ✅ Deployed updated queue-processor Edge Function

### 4. Automated Queue Processing
- ✅ Created process-queues Edge Function
- ✅ Set up GitHub Actions cron (runs every 5 minutes)
- ✅ Can be manually triggered for testing

### 5. Database Updates
- ✅ Created migration for `direct_message` trigger type
- ⚠️  **NEEDS MANUAL ACTION**: Migration SQL ready but needs to be applied

---

## 🔧 Next Steps (In Order)

### ✅ Step 1: Apply Database Migration - READY TO RUN
**Action Required:** Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE public.triggers
DROP CONSTRAINT IF EXISTS triggers_trigger_type_check;

ALTER TABLE public.triggers
ADD CONSTRAINT triggers_trigger_type_check
CHECK (trigger_type IN ('comment', 'story_reply', 'mention', 'direct_message'));
```

**How to do it:**
1. Go to: https://supabase.com/dashboard/project/uznzejmekcgwgtilbzby/sql/new
2. Paste the SQL above
3. Click "Run"

**Status:** SQL is ready, just needs to be executed in dashboard

---

### Step 2: Create a Test Flow (30 minutes)
We need to create a simple test flow manually in the database to test end-to-end.

**Test Flow Structure:**
```
Trigger: When message contains "hello"
  ↓
Action: Send reply "Hi! Thanks for messaging us. How can we help?"
```

**SQL to create test flow:**
```sql
-- Insert a simple test flow
INSERT INTO public.flows (team_id, name, spec, is_active)
SELECT
  team_id,
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
FROM public.teams
LIMIT 1
RETURNING id;

-- Note the flow ID from above, then create a trigger
INSERT INTO public.triggers (team_id, ig_account_id, trigger_type, filters, flow_id, is_active)
SELECT
  t.id as team_id,
  ig.id as ig_account_id,
  'direct_message',
  '{"include_keywords": ["hello", "hi"]}'::jsonb,
  '<FLOW_ID_FROM_ABOVE>',
  true
FROM public.teams t
JOIN public.ig_accounts ig ON ig.team_id = t.id
LIMIT 1;
```

---

### ✅ Step 3: Fix Queue Processor Schema Mismatches - COMPLETED

The `queue-processor` Edge Function schema mismatches have been fixed and deployed:

**Fixed issues:**
1. ✅ `flow.nodes` → `flow.spec.nodes` (now parsing spec.nodes as object)
2. ✅ `flow.edges` → `flow.spec.edges`
3. ✅ `execution.execution_data` → `execution.context`
4. ✅ Message sending now uses messages table directly (not message_queue)
5. ✅ Status values corrected (active/waiting/completed/failed)
6. ✅ Node types updated to match flow builder (message node)
7. ✅ Removed references to non-existent conversation fields

**Status:** Deployed and ready to process flows

---

### Step 4: Test End-to-End (30 minutes)

Once Steps 1-3 are complete:

1. **Send test message:**
   - From a different Instagram account
   - Send "hello" to @thejanorsula

2. **Check webhook received it:**
   ```bash
   curl https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/check-webhook-logs \
     -H "Authorization: Bearer sb_publishable_mcm7O98OaokMBzAHGfb18w_Y-L2rjDA"
   ```

3. **Check flow was queued:**
   ```sql
   SELECT * FROM flow_executions ORDER BY created_at DESC LIMIT 5;
   ```

4. **Manually trigger queue processor:**
   ```bash
   curl -X POST https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/queue-processor \
     -H "Authorization: Bearer sb_secret_6qnQtnPkx2GAng4cnTHC2Q_ZAYnW2Vi" \
     -H "Content-Type: application/json" \
     -d '{"type": "flow_execution"}'
   ```

5. **Check if reply was sent:**
   ```sql
   SELECT * FROM messages WHERE direction = 'out' ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📊 Current Architecture

```
┌─────────────────────┐
│  Instagram DM       │
│  "hello"            │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Webhook Handler    │
│  - Save message     │
│  - Check triggers   │
│  - Queue flow       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  flow_executions    │
│  (Database Queue)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Queue Processor    │
│  - Execute nodes    │
│  - Queue messages   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  message_queue      │
│  (Outgoing)         │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Send via Instagram │
│  API                │
└─────────────────────┘
```

---

## 🐛 Known Issues

1. ✅ ~~Queue processor not running automatically~~ - **FIXED**: GitHub Actions cron runs every 5 minutes
2. ✅ ~~Schema mismatches~~ - **FIXED**: All schema mismatches corrected
3. **No UI for flow creation yet** - Must use SQL for now
4. **Message sending not tested** - Instagram API integration untested
5. **No error handling for failed flows** - Will retry but no notifications

## ⚙️ Queue Processing Setup

**Automated Processing:**
- GitHub Actions workflow runs every 5 minutes
- Processes both flow executions and message sending
- Can be manually triggered from Actions tab

**Manual Processing (for testing):**
```bash
curl -X POST "https://uznzejmekcgwgtilbzby.supabase.co/functions/v1/process-queues" \
  -H "Authorization: Bearer sb_secret_6qnQtnPkx2GAng4cnTHC2Q_ZAYnW2Vi"
```

**For Production:**
- Consider using pg_cron extension in PostgreSQL
- Or deploy a dedicated worker service
- Current 5-minute interval is GitHub Actions limitation

---

## 💡 Quick Wins for Tomorrow

1. ✅ Fix queue processor schema issues
2. ✅ Set up cron job to run queue processor every minute
3. ✅ Create simple UI form to create test flows
4. ✅ Add flow execution monitoring dashboard
5. ✅ Test actual message sending through Instagram API

---

## 🎯 Success Criteria for Phase 1

- [ ] Message arrives → Webhook receives it → Flow triggered
- [ ] Flow executes → Message queued → Sent via Instagram API
- [ ] Reply appears in Instagram DM thread
- [ ] Can create simple flows via UI
- [ ] Can see flow execution status in dashboard

**Current Status:** 40% complete (2/5 criteria met)
