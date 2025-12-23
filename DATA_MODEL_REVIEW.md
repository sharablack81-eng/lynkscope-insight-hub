# Multi-Merchant Data Model Review

## Overview

This document outlines the optimized data model for a multi-merchant Shopify app, ensuring strict shop isolation, clean install/uninstall handling, and no cross-merchant data leakage.

## Key Principles

### 1. Shop Isolation ✅
- **One shop = One merchant account**: UNIQUE constraint on `shop_domain`
- **Shop-scoped data**: All user data (links, clicks, A/B tests) scoped to shop
- **RLS policies**: Enforce shop isolation at database level
- **No cross-merchant access**: Users can only access data for their own shops

### 2. Clean Install Handling ✅
- **Automatic shop assignment**: Links automatically get `shop_domain` when created
- **Shop connection**: OAuth flow stores shop connection in merchants table
- **Token management**: Tokens stored with shop metadata

### 3. Clean Uninstall Handling ✅
- **Complete cleanup**: All shop-scoped data deleted on uninstall
- **Cascading deletes**: Foreign keys ensure related data is cleaned up
- **Idempotent**: Safe to call cleanup multiple times
- **Token revocation**: Tokens cleared and marked as revoked

### 4. Data Model Simplicity ✅
- **Explicit relationships**: Clear foreign keys and constraints
- **No abstractions**: Direct table relationships
- **Easy to reason about**: One shop per merchant, shop-scoped data
- **Scalable**: Indexes for performance, RLS for security

## Database Schema

### merchants Table

```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE              -- One user = one merchant account
shop_domain TEXT UNIQUE          -- One shop = one merchant (when not NULL)
shopify_access_token TEXT        -- Server-side only, never exposed
shopify_scopes TEXT              -- Granted OAuth scopes
token_status TEXT                -- 'active', 'revoked', or 'invalid'
token_last_validated TIMESTAMP   -- Last validation timestamp
subscription_status TEXT         -- 'trial', 'active', 'cancelled', 'expired'
shopify_charge_id TEXT           -- Shopify billing charge ID
trial_start_date TIMESTAMP
trial_end_date TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Constraints:**
- `user_id UNIQUE` - One merchant account per user
- `shop_domain UNIQUE WHERE shop_domain IS NOT NULL` - One shop per merchant account

### links Table

```sql
id UUID PRIMARY KEY
user_id UUID                     -- Owner of the link
shop_domain TEXT                  -- Shop this link belongs to (NULL if before shop connection)
title TEXT
url TEXT
short_code TEXT UNIQUE
platform TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Constraints:**
- `short_code UNIQUE` - Unique short codes globally
- `shop_domain` - Scoped to shop (can be NULL for legacy links)

**Automatic Assignment:**
- Trigger assigns `shop_domain` from user's active shop when link is created
- Ensures new links are always scoped to shop

### link_clicks Table

```sql
id UUID PRIMARY KEY
link_id UUID                     -- Foreign key to links
shop_domain TEXT                  -- Denormalized from links for performance
clicked_at TIMESTAMP
referrer TEXT
user_agent TEXT
ip_address TEXT
converted BOOLEAN                 -- For A/B test tracking
```

**Constraints:**
- `link_id` - Foreign key with CASCADE delete
- `shop_domain` - Denormalized for performance and isolation

**Automatic Sync:**
- Trigger syncs `shop_domain` from links when link is created/updated

### ab_tests Table

```sql
id UUID PRIMARY KEY
user_id UUID                     -- Owner of the test
variant_a_id UUID                -- Foreign key to links
variant_b_id UUID                -- Foreign key to links
name TEXT
status TEXT                      -- 'active' or 'ended'
winner_variant TEXT              -- 'A' or 'B'
created_at TIMESTAMP
ended_at TIMESTAMP
```

**Constraints:**
- `variant_a_id`, `variant_b_id` - Foreign keys with CASCADE delete
- Cleaned up via links when shop is uninstalled

### expire_links Table

```sql
id UUID PRIMARY KEY
user_id UUID                     -- Owner
link_id UUID                     -- Foreign key to links
name TEXT
expire_type TEXT                 -- 'time-based', 'day-based', 'click-based'
expires_at TIMESTAMP
max_clicks INTEGER
is_active BOOLEAN
created_at TIMESTAMP
```

**Constraints:**
- `link_id` - Foreign key with CASCADE delete
- Cleaned up via links when shop is uninstalled

## Shop Isolation Mechanisms

### 1. Database Constraints

**UNIQUE Constraint:**
```sql
merchants_shop_domain_unique UNIQUE (shop_domain) WHERE shop_domain IS NOT NULL
```
- Prevents same shop from being connected to multiple merchants
- Prevents data leakage between merchants

### 2. RLS Policies

**Links Policy Example:**
```sql
USING (
  auth.uid() = user_id 
  AND (
    shop_domain IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.merchants
      WHERE merchants.shop_domain = links.shop_domain
      AND merchants.user_id = auth.uid()
      AND merchants.token_status = 'active'
    )
  )
)
```

**Key Points:**
- Checks `user_id` matches authenticated user
- Checks `shop_domain` belongs to user's active shop
- Allows NULL `shop_domain` for legacy links
- Requires `token_status = 'active'` for shop-scoped access

### 3. Application-Level Checks

**Server-Side Validation:**
- All shop operations verify `shop_domain` matches user's shop
- Token status checked before shop operations
- Shop domain normalized and validated

## Install Flow

1. **User Signs Up**
   - Merchant record created automatically (trigger)
   - `subscription_status = 'trial'`
   - No `shop_domain` yet

2. **User Connects Shop**
   - OAuth flow stores `shop_domain` and `shopify_access_token`
   - `token_status = 'active'`
   - Scopes stored in `shopify_scopes`

3. **User Creates Links**
   - Trigger automatically assigns `shop_domain` from active shop
   - Links are scoped to shop
   - RLS policies enforce shop isolation

## Uninstall Flow

1. **Webhook Received**
   - `app/uninstalled` webhook from Shopify
   - HMAC verified
   - Idempotency checked

2. **Data Cleanup**
   - `cleanup_shop_data()` function called
   - Deletes all links for shop (cascades to clicks)
   - Deletes A/B tests for shop links
   - Deletes expire links for shop links
   - Cleans up orphaned clicks

3. **Token Revocation**
   - `shopify_access_token` set to NULL
   - `shop_domain` set to NULL
   - `token_status = 'revoked'`
   - Merchant record remains (for subscription tracking)

## Data Leakage Prevention

### ✅ Shop Domain Uniqueness
- UNIQUE constraint prevents same shop connecting to multiple accounts
- Prevents cross-merchant data access

### ✅ RLS Policies
- All policies check shop ownership
- Users can only access data for their own shops
- Token status verified (must be 'active')

### ✅ Foreign Key Constraints
- Links reference merchants via `shop_domain`
- Cascading deletes ensure cleanup
- No orphaned data

### ✅ Application Logic
- Server-side validation of shop ownership
- Token status checked before operations
- Shop domain normalized and validated

## Scalability Considerations

### Indexes
- `idx_merchants_shop_domain` - Fast shop lookups
- `idx_links_shop_domain` - Fast link queries by shop
- `idx_link_clicks_shop_domain` - Fast click queries by shop
- `idx_merchants_token_status` - Fast active token lookups

### Performance
- Denormalized `shop_domain` in `link_clicks` for faster queries
- Indexes on all shop-scoped columns
- Partial indexes for active shops only

## Testing Checklist

- [ ] Shop domain uniqueness enforced
- [ ] RLS policies prevent cross-shop access
- [ ] Links automatically get shop_domain on creation
- [ ] Uninstall cleans up all shop data
- [ ] Token revocation works correctly
- [ ] Legacy links (NULL shop_domain) still accessible
- [ ] Foreign key constraints work correctly
- [ ] Cascading deletes work correctly
- [ ] Cleanup function is idempotent

## App Store Compliance

✅ **Shop Isolation**: Strict isolation between shops
✅ **Data Cleanup**: Complete cleanup on uninstall
✅ **Token Security**: Tokens never exposed to client
✅ **RLS Policies**: Database-level security
✅ **Foreign Keys**: Referential integrity
✅ **Uniqueness**: Prevents duplicate connections

## Migration Order

1. Run `20251220000002_shop_isolation.sql` - Adds shop isolation
2. Run `20251220000003_link_shop_assignment.sql` - Adds auto-assignment
3. Update application code to use shop-scoped queries
4. Test install/uninstall flows

## Notes

- `shop_domain` can be NULL for links created before shop connection
- RLS policies allow NULL `shop_domain` for backward compatibility
- Cleanup function is idempotent (safe to call multiple times)
- Foreign keys use CASCADE delete for automatic cleanup
- Denormalized `shop_domain` in `link_clicks` for performance

