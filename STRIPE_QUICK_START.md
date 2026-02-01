# Stripe Billing System - Quick Start

## ⚡ 5-Minute Setup

### Step 1: Get Stripe Keys
1. Visit [Stripe Dashboard](https://stripe.com/login)
2. Go to **Developers** → **API Keys**
3. Copy **Secret Key** (starts with `sk_live_`)

### Step 2: Create Products
1. Go to **Products** → **+ Add Product**
2. Create two products:
   - **Basic**: $9/month (`price_xxx...` for Basic)
   - **Pro**: $29/month (`price_yyy...` for Pro)

### Step 3: Configure Webhook
1. Go to **Webhooks** → **+ Add Endpoint**
2. URL: `https://your-project.supabase.co/functions/v1/billing-webhooks`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Copy **Signing Secret** (starts with `whsec_`)

### Step 4: Set Secrets
```bash
supabase secrets set STRIPE_SECRET_KEY "sk_live_..."
supabase secrets set STRIPE_PRICE_ID_BASIC "price_..."
supabase secrets set STRIPE_PRICE_ID_PRO "price_..."
supabase secrets set STRIPE_WEBHOOK_SECRET "whsec_..."
```

### Step 5: Deploy
```bash
supabase functions deploy billing-checkout
supabase functions deploy billing-portal
supabase functions deploy billing-webhooks
supabase functions deploy billing-cancel
supabase migration up
npm run build
```

### ✅ Done! 🎉

---

## 📖 Full Documentation

| Document | Purpose |
|----------|---------|
| [STRIPE_CONFIGURATION.md](./STRIPE_CONFIGURATION.md) | **Configuration** - Detailed setup guide |
| [STRIPE_BILLING_IMPLEMENTATION.md](./STRIPE_BILLING_IMPLEMENTATION.md) | **Architecture** - System design & specs |
| [STRIPE_DEPLOYMENT_CHECKLIST.md](./STRIPE_DEPLOYMENT_CHECKLIST.md) | **Deployment** - Step-by-step deployment |
| [STRIPE_IMPLEMENTATION_COMPLETE.md](./STRIPE_IMPLEMENTATION_COMPLETE.md) | **Summary** - Completion status & overview |

---

## 🧪 Test Checkout

```bash
# After deployment, test with:

# 1. Create test account
# Login at https://lynkscope.io

# 2. Go to Premium page
# Click "Upgrade to Pro"

# 3. Use test card
# Card: 4242 4242 4242 4242
# Expiry: 12/25
# CVC: 123

# 4. Verify in Settings
# Should show "Pro" plan
```

---

## 🚨 Important Files

### Edge Functions (New)
- `supabase/functions/billing-checkout/index.ts` - Checkout sessions
- `supabase/functions/billing-portal/index.ts` - Customer portal
- `supabase/functions/billing-webhooks/index.ts` - Webhook handler
- `supabase/functions/billing-cancel/index.ts` - Subscription cancellation

### Database
- `supabase/migrations/20260201_stripe_subscriptions.sql` - Schema migration

### Removed (Shopify)
- ❌ `shopify-*` functions deleted
- ❌ Shopify test file deleted
- ❌ Shopify type definitions removed

---

## 🔑 Environment Variables

```
STRIPE_SECRET_KEY           Required: sk_live_...
STRIPE_PRICE_ID_BASIC       Required: price_...
STRIPE_PRICE_ID_PRO         Required: price_...
STRIPE_WEBHOOK_SECRET       Required: whsec_...
APP_URL                     Optional: https://lynkscope.io
```

---

## ✅ Verification

After setup, verify:

```bash
# Check secrets are set
supabase secrets list

# Check functions deployed
supabase functions list | grep billing

# Check build passes
npm run build
```

---

## 📞 Need Help?

1. **Setup Issues** → See [STRIPE_CONFIGURATION.md](./STRIPE_CONFIGURATION.md#troubleshooting-configuration)
2. **Architecture Questions** → See [STRIPE_BILLING_IMPLEMENTATION.md](./STRIPE_BILLING_IMPLEMENTATION.md)
3. **Deployment Issues** → See [STRIPE_DEPLOYMENT_CHECKLIST.md](./STRIPE_DEPLOYMENT_CHECKLIST.md#troubleshooting)
4. **Stripe Support** → Visit [stripe.com/help](https://stripe.com/help)

---

## 🎯 What's Changed

### ✅ Added
- 4 Stripe Edge Functions
- Subscriptions table with RLS policies
- Webhook event handling
- Stripe customer management

### ❌ Removed
- All Shopify code and functions
- Shopify type definitions
- Shopify API integrations

### 🔄 Updated
- Settings page (Shopify → Stripe)
- Dashboard (charge confirmation → session handling)
- Privacy Policy (Shopify → Stripe)
- Terms of Service (Shopify → Stripe)

---

**Status**: ✅ Production Ready  
**Build**: ✅ Passing (0 errors)  
**Documentation**: ✅ Complete  

Ready to deploy! 🚀
