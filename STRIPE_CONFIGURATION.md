# Stripe Billing Configuration Guide

## Quick Setup

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Live Mode** (toggle in top left)
3. Navigate to **Developers** → **API Keys**
4. Copy your **Secret Key** (starts with `sk_live_`)
5. **Never share** this key - keep it secret

### 2. Create Products and Prices

#### Basic Plan
1. Navigate to **Product Catalog** → **Products**
2. Click **+ Add product**
3. Fill in:
   - **Product name**: `Lynkscope Basic`
   - **Description**: `10 short links, analytics, basic support`
   - **Type**: Recurring
   - **Billing**: Monthly ($9/month)
4. Click **Save**
5. Find the price in **Pricing** section and copy the **Price ID** (starts with `price_`)

#### Pro Plan
1. Repeat above for **Pro** plan:
   - **Product name**: `Lynkscope Pro`
   - **Description**: `Unlimited short links, advanced analytics, AI assistant, premium support`
   - **Billing**: Monthly ($29/month)
2. Copy the Price ID

### 3. Configure Webhook

1. Navigate to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://your-project.supabase.co/functions/v1/billing-webhooks`
   - Replace `your-project` with your actual Supabase project ID
4. **Events to send**:
   - Select `checkout.session.completed`
   - Select `customer.subscription.updated`
   - Select `customer.subscription.deleted`
   - Select `invoice.paid`
   - Select `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the endpoint you just created
7. Scroll down to **Signing secret**
8. Click **Reveal** and copy the signing secret (starts with `whsec_`)

### 4. Set Environment Variables

#### Option A: Using Supabase CLI
```bash
# Set Stripe keys
supabase secrets set STRIPE_SECRET_KEY "sk_live_..."
supabase secrets set STRIPE_PRICE_ID_BASIC "price_..."
supabase secrets set STRIPE_PRICE_ID_PRO "price_..."
supabase secrets set STRIPE_WEBHOOK_SECRET "whsec_..."

# Optional: Set app URL (defaults to https://lynkscope.io)
supabase secrets set APP_URL "https://your-domain.com"
```

#### Option B: Using Supabase Dashboard
1. Go to **Project Settings** → **API**
2. Scroll to **Secret**
3. Click **New Secret** for each key and paste value

### 5. Deploy Edge Functions

```bash
# Deploy all billing functions
supabase functions deploy billing-checkout
supabase functions deploy billing-portal
supabase functions deploy billing-webhooks
supabase functions deploy billing-cancel
```

### 6. Run Database Migration

```bash
# Apply the Stripe subscriptions migration
supabase migration up

# Or migrate specific file:
supabase db push 20260201_stripe_subscriptions.sql
```

## Environment Variables Reference

### STRIPE_SECRET_KEY ⚠️ **CRITICAL**
- **Type**: Secret API Key
- **Format**: `sk_live_...` (live) or `sk_test_...` (test)
- **Usage**: All backend API calls to Stripe
- **Where to get**: Stripe Dashboard → Developers → API Keys → Secret key
- **⚠️ Never commit** to version control or share publicly

### STRIPE_PRICE_ID_BASIC
- **Type**: Price ID
- **Format**: `price_...` (typically 14+ alphanumeric characters)
- **Usage**: Billing checkout for Basic plan
- **Where to get**: Stripe Dashboard → Products → [Lynkscope Basic] → Pricing section

### STRIPE_PRICE_ID_PRO
- **Type**: Price ID
- **Format**: `price_...`
- **Usage**: Billing checkout for Pro plan
- **Where to get**: Stripe Dashboard → Products → [Lynkscope Pro] → Pricing section

### STRIPE_WEBHOOK_SECRET ⚠️ **CRITICAL**
- **Type**: Webhook Signing Secret
- **Format**: `whsec_...`
- **Usage**: Verifying webhook requests from Stripe
- **Where to get**: Stripe Dashboard → Developers → Webhooks → [your endpoint] → Signing secret
- **⚠️ Never commit** to version control
- **Note**: This is different from API key and only works for this specific webhook

### APP_URL (Optional)
- **Type**: Frontend URL
- **Format**: `https://yourdomain.com` (no trailing slash)
- **Default**: `https://lynkscope.io`
- **Usage**: Return URLs after checkout and portal
- **Where to set**: `.env.local` (local) or Supabase secrets (production)

## Verify Configuration

### Check Environment Variables are Set
```bash
# View all secrets (redacted)
supabase secrets list

# Should show:
# STRIPE_SECRET_KEY          ✓
# STRIPE_PRICE_ID_BASIC      ✓
# STRIPE_PRICE_ID_PRO        ✓
# STRIPE_WEBHOOK_SECRET      ✓
# APP_URL                    ✓ (or empty if using default)
```

### Test Stripe Connection
```bash
# Using Stripe CLI to test webhook
stripe listen --forward-to https://your-project.supabase.co/functions/v1/billing-webhooks

# In another terminal, trigger test event
stripe trigger customer.subscription.updated
```

### Verify Database Migration
```sql
-- Connect to your Supabase database and run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'subscriptions';

-- Should return 1 row
```

## Testing Configuration

### Test Mode Setup (Optional)
For testing before going live:

1. Use **Test API Keys** instead:
   - Stripe Dashboard → **Test mode** toggle
   - API Keys → **Secret key** (starts with `sk_test_`)
   
2. Use **Test Price IDs** created in test mode

3. Use **Test Webhook Secret** from test webhook endpoint

4. Test cards available:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - CVC fail: `4000 0000 0000 0069`

### Switch to Live Mode
When ready for production:

1. Update secrets to use `sk_live_` keys (not `sk_test_`)
2. Verify webhook endpoint uses live webhook secret
3. Redeploy Edge Functions after updating secrets

## Troubleshooting Configuration

### "Invalid API Key" Error
**Solution**:
- Verify `STRIPE_SECRET_KEY` starts with `sk_live_` or `sk_test_`
- Check it's the **Secret key**, not Publishable key
- Ensure no extra spaces or characters
- Copy directly from Stripe dashboard

### "Invalid Price ID" Error
**Solution**:
- Verify `STRIPE_PRICE_ID_BASIC` and `STRIPE_PRICE_ID_PRO` exist
- Check in Stripe Dashboard → Products → [Product] → Pricing
- Ensure no `SKU` used instead of `Price ID`
- Price IDs start with `price_`

### Webhook Not Firing
**Solution**:
- Check webhook endpoint URL is accessible
- Verify `STRIPE_WEBHOOK_SECRET` is correct (from webhook settings)
- Check webhook events selected: `checkout.session.*`, `customer.subscription.*`, `invoice.*`
- View webhook logs in Stripe Dashboard → Developers → Webhooks → [endpoint]

### "Unauthorized" Response from Webhooks
**Solution**:
- Verify signature secret is correct
- Check your system clock is accurate (signature uses timestamp)
- Ensure webhook is configured to forward all required events

## Security Checklist

- [ ] ✅ `STRIPE_SECRET_KEY` never committed to git
- [ ] ✅ `.env.local` added to `.gitignore`
- [ ] ✅ `STRIPE_WEBHOOK_SECRET` is different from API key
- [ ] ✅ Using `sk_live_` keys (not `sk_test_`) in production
- [ ] ✅ Webhook signature verification enabled
- [ ] ✅ HTTPS enforced for webhook endpoint
- [ ] ✅ Edge Functions use service role for webhook processing
- [ ] ✅ Row-level security (RLS) enabled on subscriptions table

## Common Values Reference

| Environment | STRIPE_SECRET_KEY | STRIPE_PRICE_ID_* | STRIPE_WEBHOOK_SECRET |
|-------------|-------------------|-------------------|----------------------|
| Development | `sk_test_...` | `price_1NX...` (test) | `whsec_test_...` |
| Staging | `sk_test_...` | `price_1NX...` (test) | `whsec_test_...` |
| Production | `sk_live_...` | `price_1NX...` (live) | `whsec_1NX...` |

## Next Steps

1. ✅ Get Stripe API keys
2. ✅ Create Basic and Pro products
3. ✅ Configure webhook
4. ✅ Set environment variables
5. ✅ Deploy Edge Functions
6. ✅ Run database migration
7. ✅ Test checkout flow
8. ✅ Test webhook delivery
9. ✅ Go live!

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Billing Documentation**: https://stripe.com/docs/billing
- **Webhook Guide**: https://stripe.com/docs/webhooks

---

**Configuration Guide Version**: 1.0.0  
**Last Updated**: $(date)
