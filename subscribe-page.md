# Subscribe Instagram Page to Webhooks

## Problem
Meta webhooks are configured at the app level, but each Page/Instagram account must be **individually subscribed** to actually receive webhooks.

## Solution

### Option 1: Via Graph API Explorer

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your App from dropdown
3. Get a Page Access Token with these permissions:
   - `pages_messaging`
   - `instagram_basic`
   - `instagram_manage_messages`
4. Run this POST request:
   ```
   POST /771502572705548/subscribed_apps
   {
     "subscribed_fields": ["messages", "messaging_postbacks", "message_reactions"]
   }
   ```

### Option 2: Via curl

Replace `YOUR_PAGE_ACCESS_TOKEN` with your actual token:

```bash
curl -X POST "https://graph.facebook.com/v23.0/771502572705548/subscribed_apps" \
  -d "subscribed_fields=messages,messaging_postbacks,message_reactions" \
  -d "access_token=YOUR_PAGE_ACCESS_TOKEN"
```

### Option 3: Via Connect Instagram Flow (Recommended)

The OAuth flow should have done this automatically, but it might have failed silently.

Run this SQL to get your encrypted page token:

```sql
SELECT page_id, username
FROM ig_accounts
WHERE username = 'thejanorsula';
```

Then use the token to subscribe the page.

## Verify Subscription

After subscribing, verify it worked:

```
GET /771502572705548/subscribed_apps?fields=subscribed_fields
```

You should see:
```json
{
  "data": [
    {
      "subscribed_fields": ["messages", "messaging_postbacks", "message_reactions"],
      "id": "YOUR_APP_ID"
    }
  ]
}
```

## Test

Once subscribed:
1. Send a test message from another Instagram account
2. You should see a POST request in the Edge Function logs
3. The webhook will save the event to `events_inbox`
