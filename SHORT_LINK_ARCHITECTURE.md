# Short Link System - Technical Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER (React)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Links Page ────┬─────────→ LinkCard Component                             │
│                 │                    ↓                                      │
│                 └──────────→ ShortLinkDisplay                              │
│                              ├─ Generate Button                            │
│                              ├─ Copy Button                                │
│                              └─ Regenerate Button                          │
│                                                                              │
│  lib/url-validation.ts ── Client-side validation before sending            │
│  lib/backend.ts ────────── BACKEND_URL, BACKEND_ANON_KEY                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                              HTTP Requests
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  POST /short-link-create                                                   │
│  ├─ Validate JWT token                                                     │
│  ├─ Validate & normalize URL                                               │
│  ├─ Check rate limit (100/hour)                                            │
│  ├─ Generate unique short code                                             │
│  ├─ Create record in short_links table                                     │
│  └─ Return short_url + metadata                                            │
│                                                                              │
│  GET /short-link-redirect/{code}                                           │
│  ├─ Look up short_code in database                                         │
│  ├─ Increment click_count                                                  │
│  ├─ Record click in smart_link_clicks (async)                              │
│  ├─ Parse user agent → browser, device                                     │
│  ├─ Extract country from Accept-Language                                   │
│  └─ Return 302 redirect to original_url                                    │
│                                                                              │
│  Utilities (short-link-utils.ts)                                           │
│  ├─ generateShortCode()                                                    │
│  ├─ ensureUniqueShortCode()                                                │
│  ├─ validateAndNormalizeUrl()                                              │
│  ├─ isSuspiciousUrl()                                                      │
│  └─ checkRateLimit()                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          Service Role Auth
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  short_links TABLE                                                         │
│  ├─ id: UUID (PK)                                                          │
│  ├─ short_code: TEXT (UNIQUE) ──┬─→ INDEX: idx_short_links_short_code    │
│  ├─ original_url: TEXT           │                                         │
│  ├─ user_id: UUID (FK) ──────────┼─→ INDEX: idx_short_links_user_id      │
│  ├─ business_id: UUID            │                                         │
│  ├─ created_at: TIMESTAMP ───────┼─→ INDEX: idx_short_links_created_at   │
│  ├─ click_count: INT (DEFAULT 0)                                          │
│  └─ last_clicked_at: TIMESTAMP                                            │
│                                                                              │
│  RLS POLICIES                                                              │
│  ├─ Users can only view their own links                                    │
│  ├─ Users can only create for themselves (user_id = auth.uid())           │
│  ├─ Users can only update their own links                                  │
│  ├─ Service role bypasses RLS for tracking                                 │
│  └─ No cross-user access possible                                          │
│                                                                              │
│  smart_link_clicks TABLE (Existing)                                        │
│  ├─ id: UUID (PK)                                                          │
│  ├─ clicked_at: TIMESTAMP                                                  │
│  ├─ destination_url: TEXT                                                  │
│  ├─ merchant_id: UUID (from short link creation)                           │
│  ├─ link_id: UUID (NULL for short links)                                   │
│  ├─ browser: TEXT                                                          │
│  ├─ device_type: TEXT                                                      │
│  ├─ country: TEXT                                                          │
│  ├─ continent: TEXT                                                        │
│  ├─ referrer: TEXT                                                         │
│  ├─ user_agent: TEXT                                                       │
│  └─ ip_address: TEXT                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
                     Analytics & Reporting (Existing)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS DASHBOARD                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AnalyticsOverview ── Reads smart_link_clicks ── Displays:                │
│  ├─ Total clicks (includes short link clicks)                              │
│  ├─ Device breakdown (Mobile/Desktop/Tablet)                               │
│  ├─ Browser breakdown (Chrome/Safari/Firefox/etc)                          │
│  ├─ Country/Continent breakdown                                            │
│  ├─ Daily trend chart                                                      │
│  └─ Top links                                                              │
│                                                                              │
│  AdvancedAnalytics ── Same data, deeper analysis                           │
│  ├─ Hourly trends                                                          │
│  ├─ Geographic heatmap                                                     │
│  ├─ Device cross-tabulation                                                │
│  └─ Export (PDF/CSV)                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Create Short Link Flow

```
User                Browser              Edge Function        Database
 │                    │                        │                 │
 ├─ Click "Generate"──→│                        │                 │
 │                    ├─ Validate URL         │                 │
 │                    ├─ Send JWT token───────→│                 │
 │                    │                        ├─ Validate token │
 │                    │                        ├─ Check rate limit
 │                    │                        ├─ Validate URL   │
 │                    │                        ├─ Generate code──→│
 │                    │                        │                 ├─ Check unique
 │                    │                        │←─ Code unique ──┤
 │                    │                        │                 │
 │                    │                        ├─ INSERT record─→│
 │                    │                        │                 ├─ Record created
 │                    │                        │←─ ID + metadata─┤
 │                    │                        │                 │
 │                    │←─ short_url ──────────┤                 │
 │                    │                        │                 │
 │←─ Display short───┤                        │                 │
 │   link code        │                        │                 │
```

### 2. Click Short Link Flow

```
User                Browser          Edge Function         Database
 │                    │                    │                  │
 ├─ Click short───────→ GET /s/a7F3kL     │                  │
 │   link              │                    ├─ Look up code───→│
 │                    │                    │                  ├─ Find record
 │                    │                    │←─ Found ─────────┤
 │                    │                    │                  │
 │                    │                    ├─ Parse headers   │
 │                    │                    │ (UA, referrer)   │
 │                    │                    │                  │
 │                    │                    ├─ UPDATE count───→│
 │                    │                    │                  ├─ click_count++
 │                    │                    │←─ Updated ───────┤
 │                    │                    │                  │
 │                    │                    ├─ INSERT click───→│
 │                    │                    │ (async)          ├─ Analytics recorded
 │                    │                    │                  │
 │                    │←─ 302 + Location───┤                  │
 │                    │  (original_url)    │                  │
 │                    │                    │                  │
 │←─────────────────────────────────────────────────────────────
 │ (Redirect to original URL)
 │
 ├─ Load page─────→ Original website
 │                  ↓
 │ (User on original page, parameters intact)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ LAYER 1: INPUT VALIDATION                                                  │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • URL Format Check (URL constructor)                                  │ │
│ │ • Protocol Whitelist (only http, https)                              │ │
│ │ • Length Validation (max 4096 chars)                                 │ │
│ │ • Regex Pattern Matching (malicious patterns)                        │ │
│ │ • Block: javascript:, data:, vbscript:, <script>, onclick=, etc.   │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                ↓                                             │
│ LAYER 2: AUTHENTICATION                                                    │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • JWT Token Validation (decoded, checked expiry)                      │ │
│ │ • Bearer Token Extraction                                             │ │
│ │ • User ID Extraction (sub claim)                                      │ │
│ │ • Token Signature Verification (Supabase)                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                ↓                                             │
│ LAYER 3: AUTHORIZATION (RLS)                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • user_id Match Check (SELECT/UPDATE/DELETE)                         │ │
│ │ • Role-Based Access (user vs service)                                 │ │
│ │ • Row-Level Filtering (per-user isolation)                            │ │
│ │ • Service Role Bypass (for tracking only)                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                ↓                                             │
│ LAYER 4: RATE LIMITING                                                     │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • 100 links per user per hour                                         │ │
│ │ • Query: count links created in last hour                             │ │
│ │ • 429 Too Many Requests on violation                                  │ │
│ │ • Prevents abuse/spam                                                 │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                ↓                                             │
│ LAYER 5: OPEN REDIRECT PREVENTION                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • Hostname Validation (must be valid domain)                          │ │
│ │ • No Relative URLs (full URL required)                                │ │
│ │ • Protocol Check (http/https only)                                    │ │
│ │ • Pattern Detection (blocks data: URIs, etc)                          │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                ↓                                             │
│ LAYER 6: DATA INTEGRITY                                                    │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ • Unique Constraint (short_code cannot duplicate)                     │ │
│ │ • Collision Detection (retry on duplicate)                            │ │
│ │ • Check Constraint (6-8 char code length)                             │ │
│ │ • URL Length Check (validation before insert)                         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          QUERY OPTIMIZATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SHORT_CODE LOOKUP (Redirect Operation)                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT * FROM short_links WHERE short_code = ?                      │  │
│  │ Index: idx_short_links_short_code (UNIQUE)                         │  │
│  │ Complexity: O(1) - Direct index lookup                             │  │
│  │ Expected time: ~1-5ms (Database + Network)                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  USER'S LINKS QUERY (List Page)                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT * FROM short_links WHERE user_id = ?                         │  │
│  │ Index: idx_short_links_user_id                                     │  │
│  │ Complexity: O(log n) - Indexed range scan                           │  │
│  │ Expected time: ~5-20ms                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  RECENT LINKS (Dashboard)                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT * FROM short_links WHERE user_id = ? ORDER BY created_at DESC│  │
│  │ Index: idx_short_links_created_at (for sorting)                   │  │
│  │ Complexity: O(log n + k) - k = number of results                    │  │
│  │ Expected time: ~5-20ms                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  RATE LIMIT CHECK                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT COUNT(*) FROM short_links WHERE user_id = ? AND             │  │
│  │   created_at > now() - interval '1 hour'                            │  │
│  │ Optimization: count: 'exact', head: true (Supabase)                │  │
│  │ Complexity: O(log n) - Indexed scan, early termination              │  │
│  │ Expected time: ~5-15ms                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  COLLISION CHECK                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECT short_code FROM short_links WHERE short_code = ?             │  │
│  │ Index: idx_short_links_short_code (UNIQUE)                         │  │
│  │ Complexity: O(1) - Unique index lookup                              │  │
│  │ Expected time: ~1-5ms                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Scalability Characteristics

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALABILITY ANALYSIS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CAPACITY PLANNING                                                          │
│                                                                              │
│ Short Links per User       │ Performance Impact                            │
│ ───────────────────────────┼──────────────────────────                    │
│ < 1,000                    │ Negligible (< 1ms overhead)                  │
│ < 10,000                   │ Minimal (< 5ms overhead)                     │
│ < 100,000                  │ Acceptable (< 20ms overhead)                 │
│ 1M+                        │ May need partitioning                         │
│                                                                              │
│ TOTAL SHORT LINKS (System-wide)                                            │
│ ───────────────────────────┼──────────────────────────                    │
│ < 1M                       │ Single table, full performance               │
│ < 10M                      │ Indexes may increase to 100MB               │
│ < 100M                     │ Consider table partitioning by user_id      │
│ 1B+                        │ Horizontal sharding recommended              │
│                                                                              │
│ CONCURRENT REDIRECTS                                                       │
│ ───────────────────────────┼──────────────────────────                    │
│ < 100 req/sec              │ No optimization needed                       │
│ < 1,000 req/sec            │ Connection pooling essential                 │
│ < 10,000 req/sec           │ Cache layer recommended                      │
│ 100k+ req/sec              │ CDN + Cache + Load balancing needed         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOYMENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                          │
│  │  CDN (Render)│ ◄─── Static Files (React App)                           │
│  └──────────────┘                                                          │
│         ↑                                                                    │
│         │                                                                    │
│  ┌──────────────┐                                                          │
│  │  Browser     │                                                          │
│  └──────────────┘                                                          │
│         │                                                                    │
│         ├─ API Calls ───────────────────────────────────────────┐          │
│         │                                                        ↓          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              SUPABASE (Hosted)                                       │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │ Edge Functions (Deno Runtime)                               │   │  │
│  │  │ ├─ short-link-create                                        │   │  │
│  │  │ └─ short-link-redirect                                      │   │  │
│  │  │    (Auto-scaling, < 100ms cold start)                      │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                      ↓                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │ PostgreSQL Database (Read Replicas)                         │   │  │
│  │  │ ├─ short_links table                                        │   │  │
│  │  │ ├─ smart_link_clicks table (existing)                      │   │  │
│  │  │ └─ All with RLS + Indexes                                 │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                      ↓                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │ Analytics (Existing Smart Link Clicks)                      │   │  │
│  │  │ └─ Queries via supabase-js client                           │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  DEPLOYMENT FLOW                                                           │
│  ├─ Code Commit ──→ GitHub                                                │
│  ├─ CI/CD Pipeline (Optional)                                             │
│  ├─ supabase db push ──→ Migration Applied                               │
│  ├─ supabase functions deploy ──→ Functions Updated                       │
│  └─ npm build && npm deploy ──→ Frontend Updated                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling & Recovery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS & RECOVERY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ SCENARIO                          │ STATUS  │ RECOVERY                      │
│ ──────────────────────────────────┼─────────┼────────────────────────────  │
│ Database connection timeout       │ 500     │ Retry with exponential       │
│                                   │         │ backoff, fallback to cache  │
│                                   │         │                              │
│ Invalid JWT token                 │ 401     │ User re-login required       │
│                                   │         │                              │
│ Rate limit exceeded               │ 429     │ Queue for next hour window   │
│                                   │         │                              │
│ Malicious URL pattern detected    │ 400     │ Display error, suggest fix   │
│                                   │         │                              │
│ Short code collision              │ Retry   │ Auto-retry up to 5 times     │
│                                   │ internal│                              │
│                                   │         │                              │
│ Short code not found (expired?)   │ 404     │ Show not found page          │
│                                   │         │                              │
│ RLS policy violation              │ 500     │ Log incident, user isolation │
│                                   │         │                              │
│ Analytics insert failure          │ Async   │ Logged, doesn't block        │
│                                   │ fail    │ redirect                     │
│                                   │         │                              │
│ Network timeout                   │ Timeout │ Client retry, show message   │
│                                   │         │                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Alerting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    METRICS & ALERTING STRATEGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ METRIC                          │ TARGET      │ ALERT THRESHOLD             │
│ ────────────────────────────────┼─────────────┼──────────────────────────  │
│ Redirect latency p95            │ < 200ms     │ > 500ms                    │
│ Redirect latency p99            │ < 500ms     │ > 1000ms                   │
│ Error rate                      │ < 0.5%      │ > 1%                       │
│ Analytics recording success     │ > 99%       │ < 95%                      │
│ RLS policy violations           │ 0           │ > 0                        │
│ Rate limit hits per minute      │ Low         │ > 100/min                  │
│ Short code collision rate       │ Low         │ > 0.1%                     │
│ Database connection pool usage  │ < 80%       │ > 90%                      │
│ Edge function cold starts       │ < 5%        │ > 10%                      │
│ Storage used (short_links)      │ < 1GB       │ > 5GB                      │
│                                                                              │
│ LOGGING                                                                     │
│ ├─ Function logs in Supabase dashboard                                    │
│ ├─ Database query logs (enable slow query log)                            │
│ ├─ Error stack traces logged                                              │
│ └─ Click tracking success/failure logged                                  │
│                                                                              │
│ DASHBOARDS (Recommended)                                                   │
│ ├─ Real-time function metrics                                             │
│ ├─ Database performance graphs                                            │
│ ├─ Error rate tracking                                                    │
│ └─ Usage trends over time                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0.0  
**Last Updated:** February 1, 2026  
**Architecture Stability:** Production Ready
