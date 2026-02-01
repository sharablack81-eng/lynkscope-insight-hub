# Stripe Billing Deployment Checklist

## Pre-Deployment: Requirements

### ✅ Stripe Account Setup
- [ ] Stripe account created and email verified
- [ ] Live mode available (not just test mode)
- [ ] Two-factor authentication enabled
- [ ] Stripe CLI installed locally (`brew install stripe` or `choco install stripe`)

### ✅ Stripe Configuration
- [ ] `Lynkscope Basic` product created ($9/month)
- [ ] `Lynkscope Pro` product created ($29/month)
- [ ] Price IDs copied and documented
- [ ] Webhook endpoint configured
- [ ] Webhook signing secret copied and documented
- [ ] Live API Secret Key copied and documented

### ✅ Supabase Setup
- [ ] Supabase project created and active
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Connected to project: `supabase link --project-ref xxxxx`
- [ ] All Edge Functions code reviewed and ready

### ✅ Environment
- [ ] `NODE_ENV=production`
- [ ] `VITE_API_BASE=https://your-project.supabase.co` (or custom domain)
- [ ] Domain SSL certificate valid
- [ ] CORS configured correctly

---

## Phase 1: Set Environment Variables (5 minutes)

### Step 1.1: Set Stripe Secrets
```bash
# Navigate to project directory
cd /workspaces/lynkscope-insight-hub

# Set all Stripe secrets
supabase secrets set STRIPE_SECRET_KEY "sk_live_XXXXXXXXXXXXX"
supabase secrets set STRIPE_PRICE_ID_BASIC "price_XXXXXXXXXXXXX"
supabase secrets set STRIPE_PRICE_ID_PRO "price_XXXXXXXXXXXXX"
supabase secrets set STRIPE_WEBHOOK_SECRET "whsec_XXXXXXXXXXXXX"

# Optional: Set app URL if not using default
supabase secrets set APP_URL "https://lynkscope.io"
```

### Step 1.2: Verify Secrets Set
```bash
# List all secrets (values are redacted)
supabase secrets list

# Output should show:
# STRIPE_SECRET_KEY          ✓
# STRIPE_PRICE_ID_BASIC      ✓
# STRIPE_PRICE_ID_PRO        ✓
# STRIPE_WEBHOOK_SECRET      ✓
# APP_URL                    ✓
```

### ✅ Phase 1 Complete
- [ ] All secrets set in Supabase
- [ ] Secrets verified with `supabase secrets list`

---

## Phase 2: Deploy Edge Functions (10 minutes)

### Step 2.1: Deploy Checkout Function
```bash
supabase functions deploy billing-checkout

# Verify deployment:
# Should see: ✓ Deployment complete
```

### Step 2.2: Deploy Portal Function
```bash
supabase functions deploy billing-portal

# Verify deployment:
# Should see: ✓ Deployment complete
```

### Step 2.3: Deploy Webhook Function
```bash
supabase functions deploy billing-webhooks

# Verify deployment:
# Should see: ✓ Deployment complete
```

### Step 2.4: Deploy Cancel Function
```bash
supabase functions deploy billing-cancel

# Verify deployment:
# Should see: ✓ Deployment complete
```

### Step 2.5: Verify Deployments
```bash
# List all functions
supabase functions list

# Should show:
# billing-checkout    ✓ Deployed
# billing-portal      ✓ Deployed
# billing-webhooks    ✓ Deployed
# billing-cancel      ✓ Deployed
# (+ other existing functions)
```

### ✅ Phase 2 Complete
- [ ] All 4 billing functions deployed
- [ ] No deployment errors
- [ ] Functions visible in Supabase dashboard

---

## Phase 3: Deploy Database Migration (5 minutes)

### Step 3.1: Review Migration
```bash
# View the migration file
cat supabase/migrations/20260201_stripe_subscriptions.sql
```

### Step 3.2: Apply Migration
```bash
# Run pending migrations
supabase migration up

# Or push directly if not using migration history
supabase db push supabase/migrations/20260201_stripe_subscriptions.sql
```

### Step 3.3: Verify Database Changes
```bash
# Connect to your database and verify table exists:
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name='subscriptions';"

# Should return 1 row

# Verify columns:
psql $DATABASE_URL -c "\d subscriptions;"

# Should show all subscription columns and RLS policies
```

### Step 3.4: Verify Profiles Updates
```bash
# Check that profiles table was updated:
psql $DATABASE_URL -c "\d profiles;" | grep -E "plan_type|subscription_status"

# Should show both columns added
```

### ✅ Phase 3 Complete
- [ ] Subscriptions table created
- [ ] RLS policies applied
- [ ] Profiles table updated with new columns
- [ ] Indexes created

---

## Phase 4: Build and Deploy Frontend (10 minutes)

### Step 4.1: Update Build
```bash
# Navigate to project
cd /workspaces/lynkscope-insight-hub

# Install dependencies
npm install

# Build production bundle
npm run build

# Verify no errors in build output:
# Should end with: ✓ built in 12.xxs
```

### Step 4.2: Test Build Locally
```bash
# Preview production build
npm run preview

# Visit http://localhost:4173
# Verify UI loads, no console errors
```

### Step 4.3: Verify Stripe References
```bash
# Ensure Shopify references removed from build
grep -r "shopify" dist/ || echo "✓ No Shopify references in build"

# Verify Stripe references present
grep -r "billing-checkout\|billing-portal" dist/ | wc -l
# Should be > 0
```

### Step 4.4: Deploy Frontend
```bash
# Option A: Deploy to Vercel
vercel deploy --prod

# Option B: Deploy to Netlify
netlify deploy --prod --dir=dist

# Option C: Deploy to your own hosting
# Copy dist/ folder to your hosting provider

# After deployment, visit your domain and verify page loads
```

### ✅ Phase 4 Complete
- [ ] Production build successful
- [ ] No build errors or warnings
- [ ] Frontend deployed to production domain
- [ ] Domain SSL certificate valid

---

## Phase 5: Test Stripe Integration (15 minutes)

### Step 5.1: Create Test User
```bash
# Create a test account (or use existing account)
# Log in to https://lynkscope.io with test email
# Verify landing page loads
```

### Step 5.2: Test Checkout Flow
1. Log in to your test account
2. Navigate to **Premium page** → Click **Upgrade to Pro**
3. Redirected to Stripe Checkout page
4. Fill in test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Email: Any email
5. Click **Subscribe**
6. Should redirect to `/dashboard?session_id=cs_live_...`
7. Wait 2-3 seconds for webhook to process
8. Refresh page
9. Verify in **Settings**: Plan shows "Pro" ✓

### Step 5.3: Check Database
```bash
# Verify subscription was created
psql $DATABASE_URL -c "SELECT user_id, plan_type, status FROM subscriptions WHERE status='active' LIMIT 1;"

# Should show one row with plan_type='pro' and status='active'
```

### Step 5.4: Test Customer Portal
1. Go to **Settings** → Click **Manage Billing**
2. Should redirect to Stripe Customer Portal
3. Verify can see:
   - Current subscription details
   - Next renewal date
   - Payment method
   - Billing history

### Step 5.5: Test Cancellation
1. Go to **Settings** → Click **Cancel Subscription**
2. Confirm cancellation
3. Should show "Canceling at {date}"
4. Check database:
   ```bash
   psql $DATABASE_URL -c "SELECT cancel_at_period_end, status FROM subscriptions WHERE user_id='...';"
   # Should show cancel_at_period_end=true
   ```

### Step 5.6: Verify Webhook Logs
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Should see recent events with ✓ status:
   - `checkout.session.completed` → 200 ✓
   - `customer.subscription.created` → 200 ✓

### Step 5.7: Test Error Scenarios
- [ ] Declined card: `4000 0000 0000 0002` → Shows error ✓
- [ ] Invalid plan parameter → Returns 400 error ✓
- [ ] Missing auth header → Returns 401 error ✓

### ✅ Phase 5 Complete
- [ ] Checkout flow works end-to-end
- [ ] Database updates correctly
- [ ] Webhooks deliver and process
- [ ] Customer portal accessible
- [ ] Cancellation works properly

---

## Phase 6: Monitor & Verify (Ongoing)

### Daily Monitoring
- [ ] Check Stripe Dashboard for failed payments
- [ ] Verify no webhook delivery failures
- [ ] Monitor error logs in Supabase
- [ ] Check database for orphaned records

### Weekly Maintenance
- [ ] Review subscription metrics in Stripe
- [ ] Check for past_due subscriptions
- [ ] Verify webhook delivery success rate >99%
- [ ] Review customer support requests related to billing

### Monthly Reporting
```bash
# Active subscriptions
psql $DATABASE_URL -c "SELECT COUNT(*) as active_subs FROM subscriptions WHERE status='active';"

# MRR (Monthly Recurring Revenue) - requires price lookups
psql $DATABASE_URL -c "SELECT plan_type, COUNT(*) FROM subscriptions WHERE status='active' GROUP BY plan_type;"

# Churn rate
psql $DATABASE_URL -c "SELECT COUNT(*) FROM subscriptions WHERE status='canceled' AND canceled_at >= NOW() - INTERVAL '30 days';"
```

---

## Rollback Plan (If Issues Occur)

### If Stripe Integration Fails
1. Revert frontend to previous deployment
2. Keep Edge Functions deployed (no harm)
3. Database schema remains (backward compatible)
4. Debug in lower environment before retry

### If Database Migration Fails
1. Rollback migration: `supabase migration down`
2. Verify profiles table still has all columns
3. Revert frontend build
4. Fix migration script and retry

### Complete Stripe Removal (if needed)
```bash
# Disable webhooks in Stripe Dashboard
# Keep Edge Functions deployed (use no-op responses)
# Keep database schema (harmless)
# Revert frontend to pre-Stripe billing code
# Restore Shopify functions from git history
```

---

## Post-Deployment Verification

### ✅ Checklist for Successful Deployment

**Stripe Side**:
- [ ] API keys configured correctly
- [ ] Live mode enabled
- [ ] Webhook endpoint active and receiving events
- [ ] Test transactions successful

**Supabase Side**:
- [ ] All 4 Edge Functions deployed
- [ ] Secrets configured and verified
- [ ] Database migration applied
- [ ] RLS policies active
- [ ] No error logs

**Frontend Side**:
- [ ] Build successful with zero errors
- [ ] Deployed to production
- [ ] SSL certificate valid
- [ ] No console errors on pages

**Integration Side**:
- [ ] Checkout flow works end-to-end
- [ ] Webhooks deliver and update database
- [ ] Customer portal accessible
- [ ] Cancellation works properly
- [ ] Error handling graceful

### 🟢 GO LIVE APPROVED
If all checkboxes above are checked, system is ready for live traffic.

---

## Emergency Contacts & Resources

### Stripe Support
- Dashboard: https://dashboard.stripe.com
- Status Page: https://status.stripe.com
- Support: https://stripe.com/help

### Supabase Support
- Dashboard: https://app.supabase.com
- Status: https://status.supabase.com
- Docs: https://supabase.com/docs

### Documentation
- See [STRIPE_BILLING_IMPLEMENTATION.md](./STRIPE_BILLING_IMPLEMENTATION.md)
- See [STRIPE_CONFIGURATION.md](./STRIPE_CONFIGURATION.md)

---

**Deployment Checklist Version**: 1.0.0  
**Status**: Ready for deployment  
**Last Updated**: $(date)
