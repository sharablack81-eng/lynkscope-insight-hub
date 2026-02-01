# Stripe Billing System Implementation Guide

## Overview

Lynkscope has been migrated from Shopify's app billing to a **Stripe-based SaaS billing system**. This provides complete control over subscriptions, pricing, and customer management while maintaining a seamless user experience.

## Architecture

### Database Schema

#### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (references profiles),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  plan_type TEXT NOT NULL ('free', 'basic', 'pro'),
  status TEXT NOT NULL ('active', 'past_due', 'canceled', 'trialing'),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Profile Updates
- `plan_type`: User's current subscription plan
- `subscription_status`: Reflects current subscription status

### Billing Flow

1. **Checkout Session Creation** (`billing-checkout`)
   - User initiates upgrade from Premium page
   - Backend creates Stripe Checkout Session
   - User redirected to Stripe's hosted checkout page
   - Success URL: `/dashboard?session_id={CHECKOUT_SESSION_ID}`

2. **Webhook Processing** (`billing-webhooks`)
   - Stripe sends webhooks for subscription events
   - Events handled:
     - `checkout.session.completed`: Subscription activated
     - `customer.subscription.updated`: Plan changed or renewal processed
     - `customer.subscription.deleted`: Subscription canceled
     - `invoice.paid`: Payment successful
     - `invoice.payment_failed`: Payment retry needed

3. **Customer Portal** (`billing-portal`)
   - Users can manage subscriptions directly
   - Change payment method
   - Update billing info
   - Download invoices
   - Cancel subscription

4. **Cancellation** (`billing-cancel`)
   - Subscription cancels at end of billing period
   - User retains access until period end
   - Can reactivate before cancellation completes

## Edge Functions

### billing-checkout/index.ts
**Endpoint**: `POST /functions/v1/billing-checkout`

**Request**:
```json
{
  "plan": "basic" | "pro"
}
```

**Response**:
```json
{
  "sessionId": "cs_live_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Behavior**:
- Creates or retrieves Stripe customer
- Creates checkout session for selected plan
- Returns session URL for redirect

---

### billing-portal/index.ts
**Endpoint**: `POST /functions/v1/billing-portal`

**Response**:
```json
{
  "url": "https://billing.stripe.com/..."
}
```

**Behavior**:
- Opens Stripe's customer portal
- Users manage subscriptions, payment methods, invoices
- Returns at: `/dashboard`

---

### billing-cancel/index.ts
**Endpoint**: `POST /functions/v1/billing-cancel`

**Response**:
```json
{
  "success": true,
  "message": "Subscription cancelled at period end"
}
```

**Behavior**:
- Cancels subscription at end of billing period
- Sets `cancel_at_period_end: true`
- Access maintained until period end
- Webhook handles final cancellation

---

### billing-webhooks/index.ts
**Endpoint**: `POST /functions/v1/billing-webhooks`

**Handles Events**:
- `checkout.session.completed`: Creates subscription record, updates profile
- `customer.subscription.updated`: Updates subscription status and renewal dates
- `customer.subscription.deleted`: Marks subscription as canceled, downgrades to free
- `invoice.paid`: Confirms payment success
- `invoice.payment_failed`: Logs failed payment (could trigger email notification)

**Security**:
- Signature verification using HMAC-SHA256
- Validates timestamp (5-minute window)
- Service role access for database writes

## Environment Variables

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_...           # Secret API key
STRIPE_PRICE_ID_BASIC=price_...         # Stripe price ID for Basic plan
STRIPE_PRICE_ID_PRO=price_...           # Stripe price ID for Pro plan
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret

# Application URLs
APP_URL=https://lynkscope.io            # Frontend URL for redirect URLs
```

## Setup Instructions

### 1. Create Stripe Account
- Visit [stripe.com](https://stripe.com)
- Create account and enable live mode
- Copy Secret API Key

### 2. Create Products & Prices
**Basic Plan**:
- Name: "Lynkscope Basic"
- Monthly: $9/month
- Copy Price ID

**Pro Plan**:
- Name: "Lynkscope Pro"
- Monthly: $29/month
- Copy Price ID

### 3. Configure Webhook
- Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://your-api.supabase.co/functions/v1/billing-webhooks`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Copy Signing Secret

### 4. Set Environment Variables
```bash
supabase secrets set STRIPE_SECRET_KEY sk_live_...
supabase secrets set STRIPE_PRICE_ID_BASIC price_...
supabase secrets set STRIPE_PRICE_ID_PRO price_...
supabase secrets set STRIPE_WEBHOOK_SECRET whsec_...
supabase secrets set APP_URL https://lynkscope.io
```

### 5. Deploy Edge Functions
```bash
supabase functions deploy billing-checkout
supabase functions deploy billing-portal
supabase functions deploy billing-webhooks
supabase functions deploy billing-cancel
```

### 6. Run Migration
```bash
supabase migration up
```

## Frontend Integration

### Premium Page (`Premium.tsx`)
```typescript
// Trigger checkout
const startCheckout = async (plan: 'basic' | 'pro') => {
  const response = await fetch('/functions/v1/billing-checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  });
  
  const { url } = await response.json();
  window.location.href = url; // Redirect to Stripe Checkout
};
```

### Settings Page (`Settings.tsx`)
```typescript
// Manage billing
const openBillingPortal = async () => {
  const response = await fetch('/functions/v1/billing-portal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const { url } = await response.json();
  window.location.href = url;
};

// Cancel subscription
const cancelSubscription = async () => {
  const response = await fetch('/functions/v1/billing-cancel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  // Show success message and refresh subscription status
};
```

### Dashboard (`Dashboard.tsx`)
```typescript
// Handle checkout success redirect
useEffect(() => {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (sessionId) {
    // Session was created - webhook will update database
    // Subscription active after webhook processes (1-2 seconds)
    setTimeout(() => refreshSubscription(), 2000);
  }
}, []);
```

## Testing Checklist

### ✅ Checkout Flow
- [ ] Click "Upgrade to Pro" button
- [ ] Redirected to Stripe Checkout
- [ ] Enter Stripe test card: `4242 4242 4242 4242` / `12/25` / `123`
- [ ] Redirected back to `/dashboard?session_id=...`
- [ ] Subscription status updates to "pro" (check webhook logs)
- [ ] Settings shows Pro plan badge

### ✅ Portal Access
- [ ] Click "Manage Billing" in Settings
- [ ] Opens Stripe customer portal
- [ ] Can update payment method
- [ ] Can view invoices

### ✅ Cancellation
- [ ] Click "Cancel subscription"
- [ ] Displays "Cancel at period end" confirmation
- [ ] Settings shows "Canceling at {date}"
- [ ] Webhook processes cancellation at period end
- [ ] Downgraded to free plan

### ✅ Webhooks
- [ ] View webhook logs in Stripe dashboard
- [ ] Verify all events processed successfully
- [ ] Check database records match Stripe data

### ✅ Error Handling
- [ ] Failed card declines properly
- [ ] User can retry
- [ ] Invalid plan type returns 400 error
- [ ] Missing auth header returns 401 error

## Stripe Test Cards

| Card | Status | Use |
|------|--------|-----|
| `4242 4242 4242 4242` | Success | Standard test |
| `4000 0000 0000 0002` | Card declined | Test failures |
| `4000 0025 0000 3155` | Expired card | Test expiry |
| `4000 0000 0000 0069` | CVC required | Test CVC |

## Monitoring & Maintenance

### Stripe Dashboard
- **Customers**: View all Stripe customers and their subscriptions
- **Payments**: Monitor successful/failed transactions
- **Webhooks**: Check delivery status and logs
- **Invoices**: Track billing history

### Database Queries
```sql
-- Active subscriptions
SELECT user_id, plan_type, status, current_period_end
FROM subscriptions
WHERE status = 'active'
ORDER BY current_period_end;

-- Expiring soon
SELECT user_id, plan_type, current_period_end
FROM subscriptions
WHERE status = 'active'
  AND current_period_end < NOW() + INTERVAL '7 days'
ORDER BY current_period_end;

-- Failed payments
SELECT DISTINCT user_id, email
FROM profiles p
JOIN subscriptions s ON s.user_id = p.id
WHERE s.status = 'past_due'
ORDER BY p.email;
```

## Removed Shopify Code

The following Shopify-related files and code have been removed:

**Edge Functions**:
- ❌ `shopify-billing/` directory
- ❌ `shopify-oauth/` directory  
- ❌ `shopify-webhooks/` directory
- ❌ `shopify-api-client.ts`
- ❌ `shopify-token-utils.ts`

**Tests**:
- ❌ `src/tests/shopify-billing.test.ts`

**Type Definitions**:
- ❌ `shopify_access_token` from profiles table
- ❌ `shopify_charge_id` from profiles table

**Documentation**:
- ✅ Updated PrivacyPolicy.tsx (now Stripe, not Shopify)
- ✅ Updated TermsOfService.tsx (now Stripe, not Shopify)

## Troubleshooting

### Issue: Webhook signature verification fails
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` is set correctly. Check timestamp isn't >5 minutes old.

### Issue: Checkout redirects to error page
**Solution**: Check `STRIPE_PRICE_ID_BASIC` and `STRIPE_PRICE_ID_PRO` are valid. Verify prices exist in Stripe dashboard.

### Issue: Customer portal returns 404
**Solution**: Ensure user has active or past subscription. Check `stripe_customer_id` exists in database.

### Issue: Subscription not updating after checkout
**Solution**: Check webhook logs in Stripe dashboard. May take 1-2 seconds for webhook to fire. Refresh page after waiting.

## Migration from Shopify

If migrating existing Shopify customers:

1. Export Shopify customer emails and subscription status
2. Create migration script:
   ```typescript
   // Create subscriptions table records for existing Pro users
   const response = await supabase
     .from('subscriptions')
     .insert(
       proUsers.map(user => ({
         user_id: user.id,
         stripe_customer_id: null, // Will be created on first checkout
         stripe_subscription_id: null,
         plan_type: 'pro',
         status: 'active',
         created_at: new Date().toISOString(),
       }))
     );
   ```
3. Send email to Pro users: "Please log in to manage your subscription in Stripe"
4. Monitor profiles.plan_type for any null values

## API Reference

### Types

```typescript
// Subscription status in database
type SubscriptionStatus = 'active' | 'past_due' | 'trialing' | 'canceled';

// Plan types
type PlanType = 'free' | 'basic' | 'pro';

// Subscription record
interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

// Stripe event types
type StripeEvent = 
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';
```

## Support

For issues or questions:
1. Check Stripe dashboard logs
2. Review webhook delivery status
3. Check browser console for errors
4. Review Supabase Edge Function logs
5. Check database records in `subscriptions` table

---

**Status**: ✅ Production Ready  
**Last Updated**: $(date)  
**Version**: 1.0.0
