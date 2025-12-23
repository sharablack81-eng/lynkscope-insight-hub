# Shopify Webhook Implementation Review

## Overview

This document outlines the optimized webhook implementation that follows Shopify's best practices for security, idempotency, and retry handling.

## Key Features

### 1. HMAC Verification ✅
- **Verifies HMAC-SHA256 signature** from `X-Shopify-Hmac-Sha256` header
- **Required for App Store approval** - prevents webhook tampering
- **Constant-time comparison** - prevents timing attacks
- **Verified BEFORE processing** - rejects invalid webhooks immediately

### 2. Idempotent Processing ✅
- **Webhook ID tracking** - uses `X-Shopify-Webhook-Id` header for deduplication
- **Database tracking** - `webhook_events` table records processed webhooks
- **Duplicate detection** - checks if webhook already processed before handling
- **Idempotent handlers** - all handlers safe to call multiple times

### 3. Retry Safety ✅
- **Returns 200 on success** - acknowledges receipt within 5 seconds
- **Returns 500 on failure** - triggers Shopify retry (up to 19 times over 48 hours)
- **Error recording** - records failed webhooks for debugging
- **No side effects on retry** - idempotent operations prevent duplicate effects

### 4. Graceful Duplicate Handling ✅
- **Webhook ID check** - prevents processing same webhook twice
- **Idempotent database operations** - UPDATE with WHERE clauses prevent duplicates
- **Status checks** - checks current state before processing
- **Safe to process multiple times** - handlers check existing state

## Database Schema

### webhook_events Table

```sql
id UUID PRIMARY KEY
webhook_id TEXT UNIQUE          -- Shopify webhook ID (for deduplication)
shop_domain TEXT                 -- Shop domain
topic TEXT                       -- Webhook topic (e.g., 'app/uninstalled')
processed_at TIMESTAMP           -- When processed
status TEXT                      -- 'processed', 'failed', or 'retrying'
error_message TEXT               -- Error if failed
created_at TIMESTAMP             -- When record created
```

### Indexes

- `idx_webhook_events_webhook_id` - Fast lookup by webhook ID (deduplication)
- `idx_webhook_events_shop_domain` - Fast lookup by shop
- `idx_webhook_events_topic` - Fast lookup by topic
- `idx_webhook_events_processed_at` - Time-based queries

## Implementation Details

### Webhook Processing Flow

1. **Receive Request**
   - Extract headers: shop domain, HMAC, topic, webhook ID
   - Read body as text for HMAC verification

2. **HMAC Verification** (CRITICAL)
   - Verify signature BEFORE processing
   - Return 403 if invalid (don't process)

3. **Idempotency Check**
   - Check if webhook ID already processed
   - Return 200 if already processed (idempotent)

4. **Process Webhook**
   - Handle based on topic
   - All handlers are idempotent

5. **Record Processing**
   - Record webhook as processed (for future deduplication)
   - Record status: processed or failed

6. **Return Response**
   - 200 on success (acknowledges receipt)
   - 500 on failure (triggers retry)

### App Uninstall Handler

**Idempotency Features:**
- Checks if token already revoked before processing
- Uses UPDATE with WHERE clause to prevent duplicates
- Safe to call multiple times with same data
- Returns early if already processed

**Security:**
- Clears access token (sets to null)
- Clears shop domain (sets to null)
- Marks token status as 'revoked'
- Updates timestamps

## Shopify Best Practices Compliance

### ✅ Security
- HMAC verification implemented
- Constant-time comparison
- Shop domain validation
- No sensitive data in logs

### ✅ Idempotency
- Webhook ID tracking
- Duplicate detection
- Idempotent handlers
- Safe retry handling

### ✅ Error Handling
- Returns 500 on failure (triggers retry)
- Returns 200 on success (acknowledges)
- Records errors for debugging
- No information leakage

### ✅ Performance
- Quick acknowledgment (< 5 seconds)
- Efficient database queries
- Indexed lookups
- Minimal processing time

### ✅ Reliability
- Handles duplicate deliveries
- Safe retry behavior
- Error recovery
- Status tracking

## Error Scenarios

### 1. Invalid HMAC
- **Response**: 403 Forbidden
- **Action**: Reject immediately, don't process
- **Retry**: No (Shopify won't retry 403)

### 2. Missing Headers
- **Response**: 400 Bad Request
- **Action**: Reject, don't process
- **Retry**: No (Shopify won't retry 400)

### 3. Processing Error
- **Response**: 500 Internal Server Error
- **Action**: Record as failed, return 500
- **Retry**: Yes (Shopify will retry up to 19 times)

### 4. Duplicate Webhook
- **Response**: 200 OK (already processed)
- **Action**: Skip processing, acknowledge
- **Retry**: No (already processed)

### 5. Unknown Topic
- **Response**: 200 OK
- **Action**: Log, acknowledge, don't fail
- **Retry**: No (acknowledged successfully)

## Testing Checklist

- [ ] HMAC verification works correctly
- [ ] Invalid HMAC returns 403
- [ ] Duplicate webhooks are detected
- [ ] Duplicate webhooks return 200 (idempotent)
- [ ] Processing errors return 500 (triggers retry)
- [ ] Successful processing returns 200
- [ ] Webhook events are recorded in database
- [ ] Uninstall handler is idempotent
- [ ] Multiple uninstall webhooks don't cause issues
- [ ] Response time < 5 seconds
- [ ] Error messages don't leak information
- [ ] Shop domain validation works

## Monitoring

### Key Metrics to Track

1. **Webhook Processing Time**
   - Should be < 5 seconds
   - Logged in console

2. **Webhook Success Rate**
   - Query `webhook_events` table
   - Count by status

3. **Duplicate Rate**
   - Count webhooks with same ID
   - Should be low (Shopify is reliable)

4. **Error Rate**
   - Count failed webhooks
   - Monitor error messages

### Queries

```sql
-- Success rate
SELECT 
  status,
  COUNT(*) as count
FROM webhook_events
GROUP BY status;

-- Processing time distribution
SELECT 
  topic,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_seconds
FROM webhook_events
GROUP BY topic;

-- Recent failures
SELECT *
FROM webhook_events
WHERE status = 'failed'
ORDER BY processed_at DESC
LIMIT 10;
```

## App Store Compliance

✅ **HMAC Verification**: Required security measure implemented
✅ **Idempotent Processing**: Handles duplicates safely
✅ **Error Handling**: Proper retry behavior
✅ **Uninstall Handling**: Required webhook implemented
✅ **Response Times**: Acknowledges within 5 seconds
✅ **Error Logging**: Records errors for debugging

## Environment Variables

```
SHOPIFY_CLIENT_SECRET=your_client_secret (for HMAC verification)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Webhook Registration

In Shopify Partner Dashboard:
- **URL**: `https://your-supabase-url/functions/v1/shopify-webhooks`
- **Topic**: `app/uninstalled`
- **Format**: JSON
- **API Version**: 2024-01 (or latest)

## Notes

- Webhooks are delivered via POST only
- Shopify retries failed webhooks up to 19 times over 48 hours
- Webhook ID is provided in `X-Shopify-Webhook-Id` header
- HMAC is in `X-Shopify-Hmac-Sha256` header
- Must respond within 5 seconds to avoid retries
- 200 status = success, 500 status = retry, 4xx status = no retry

