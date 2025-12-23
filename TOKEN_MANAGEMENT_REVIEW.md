# Shopify Token Management Review

## Overview

This document outlines the token management system for the Shopify public app, ensuring secure, scoped, and properly managed access tokens.

## Security Principles

### 1. Server-Side Only Storage ✅
- **Access tokens are NEVER exposed to the client**
- Tokens are stored in Supabase database with RLS policies
- All token operations happen server-side in edge functions
- Client code never receives or stores access tokens

### 2. Token Scoping ✅
- Tokens are scoped per shop (one token per shop domain)
- Each token is associated with a specific `user_id` and `shop_domain`
- Token status tracked: `active`, `revoked`, or `invalid`

### 3. Token Lifecycle Management ✅

#### Installation
- Token obtained during OAuth callback
- Stored with metadata: scopes, status, last validated timestamp
- Status set to `active` on successful installation

#### Validation
- Tokens can be validated by calling Shopify API
- Validation timestamp tracked in `token_last_validated`
- Invalid tokens marked as `invalid` status

#### Revocation
- Tokens revoked on app uninstall (via webhook)
- Tokens cleared from database (`shopify_access_token` set to `null`)
- Status set to `revoked`
- Shop domain cleared

#### Cleanup
- On uninstall, all token data is cleared
- Merchant record remains but token fields are nullified
- Status prevents reuse of revoked tokens

## Database Schema

### merchants Table Columns

```sql
shop_domain TEXT                    -- Normalized shop domain (.myshopify.com)
shopify_access_token TEXT           -- Access token (NEVER exposed to client)
shopify_scopes TEXT                 -- Comma-separated granted scopes
token_status TEXT                   -- 'active', 'revoked', or 'invalid'
token_last_validated TIMESTAMP      -- Last validation timestamp
```

### Indexes

- `idx_merchants_shop_domain` - Fast lookups by shop domain
- `idx_merchants_token_status` - Fast lookups by token status
- `idx_merchants_shop_domain_active` - Fast lookups for active tokens by shop

## Implementation Details

### 1. OAuth Flow (`shopify-oauth/index.ts`)

**Token Storage:**
- Stores token with scopes and metadata on OAuth callback
- Sets `token_status` to `active`
- Sets `token_last_validated` to current timestamp

**Key Security:**
- HMAC verification on callback
- Shop domain validation
- Secure state parameter

### 2. Webhook Handler (`shopify-webhooks/index.ts`)

**App Uninstall Webhook:**
- Verifies HMAC signature from Shopify
- Finds merchant by shop domain
- Clears access token (`null`)
- Clears shop domain (`null`)
- Sets `token_status` to `revoked`
- Updates `token_last_validated` timestamp

**Security:**
- HMAC verification required
- Shop domain validation
- Idempotent (safe to call multiple times)

### 3. Token Utilities (`shopify-token-utils.ts`)

**Functions:**
- `validateShopifyToken()` - Validates token with Shopify API
- `getValidShopifyToken()` - Gets and validates token for user
- `revokeShopifyToken()` - Marks token as revoked

**Usage:**
- Called before making Shopify API requests
- Validates token is still active
- Updates validation timestamp

### 4. Billing Function (`shopify-billing/index.ts`)

**Token Checks:**
- Always checks `token_status === 'active'` before use
- Only selects token server-side
- Never exposes token to client

## RLS Policies

### Current Policies

```sql
-- Users can view their own merchant record
CREATE POLICY "Users can view their own merchant record"
ON public.merchants FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own merchant record
CREATE POLICY "Users can update their own merchant record"
ON public.merchants FOR UPDATE
USING (auth.uid() = user_id);
```

### Security Note

**CRITICAL:** The RLS policies allow users to SELECT their merchant record, but:
- Application code NEVER selects `shopify_access_token` in client queries
- All token access happens server-side in edge functions
- Client queries should only select non-sensitive fields

**Recommendation:** Consider creating a view that excludes `shopify_access_token` for client queries.

## Token Refresh

### Shopify Token Behavior

- **Shopify access tokens do NOT expire** (unlike OAuth 2.0 refresh tokens)
- Tokens remain valid until:
  - App is uninstalled
  - Merchant revokes access
  - Token is manually revoked

### Token Validation Strategy

1. **Lazy Validation**: Validate token when first used after period of inactivity
2. **Proactive Validation**: Periodically validate tokens (optional background job)
3. **On-Demand Validation**: Validate when API call fails with 401/403

### Current Implementation

- Tokens validated on-demand when making API calls
- Validation timestamp tracked
- Invalid tokens marked as `invalid` status
- Status checked before all API operations

## Uninstall Flow

### Webhook Configuration

1. **Register webhook in Shopify Partner Dashboard:**
   - URL: `https://your-supabase-url/functions/v1/shopify-webhooks`
   - Topic: `app/uninstalled`
   - Format: JSON

2. **Webhook Processing:**
   - Receives `app/uninstalled` webhook from Shopify
   - Verifies HMAC signature
   - Clears token and marks as revoked
   - Returns 200 to acknowledge receipt

### Manual Uninstall

- Users can disconnect shop in settings
- Calls same cleanup logic as webhook
- Token cleared and status set to `revoked`

## Error Handling

### Token Invalid Scenarios

1. **Token Revoked (401/403)**
   - Mark as `invalid` in database
   - Return error to user
   - Prompt for reauthorization

2. **Shop Not Connected**
   - Check `token_status !== 'active'`
   - Return `needsConnection: true`
   - Show connection UI

3. **Network Errors**
   - Don't assume token is invalid
   - Retry with exponential backoff
   - Log for monitoring

## Testing Checklist

- [ ] OAuth flow stores token with metadata
- [ ] Token validation works correctly
- [ ] Uninstall webhook clears token
- [ ] Token status prevents use of revoked tokens
- [ ] Client never receives access token
- [ ] RLS policies prevent unauthorized access
- [ ] Webhook HMAC verification works
- [ ] Token validation updates timestamp
- [ ] Invalid tokens are marked correctly

## App Store Compliance

✅ **Token Security**: Tokens stored server-side only
✅ **Token Cleanup**: Proper cleanup on uninstall
✅ **Webhook Handling**: Required webhook implemented
✅ **Token Validation**: Tokens validated before use
✅ **Scope Tracking**: Scopes stored for verification
✅ **Error Handling**: Proper error handling for invalid tokens

## Environment Variables

```
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=your_app_url
```

## Next Steps

1. **Run Migration**: Apply `20251220000000_token_management.sql`
2. **Deploy Webhook Function**: Deploy `shopify-webhooks/index.ts`
3. **Register Webhook**: Add webhook URL in Shopify Partner Dashboard
4. **Test Uninstall**: Test app uninstall triggers webhook
5. **Monitor Token Status**: Set up monitoring for token status changes

## Notes

- Tokens are stored as plain text in database (Supabase encryption at rest)
- Consider encrypting tokens at application level for additional security
- Token validation adds API overhead - use judiciously
- Webhook must be publicly accessible (no authentication required by Shopify)

