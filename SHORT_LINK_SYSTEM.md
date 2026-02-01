# Short Link System (Lynkscope)

## Overview

The Short Link System provides production-ready branded short links that retain full analytics tracking. Replace long tracking URLs with clean, memorable short codes while maintaining campaign attribution and click analytics.

## Architecture

### Database Schema

```sql
short_links {
  id: UUID (primary key)
  short_code: TEXT (unique, 6-8 chars)
  original_url: TEXT (full URL)
  user_id: UUID (foreign key → auth.users)
  business_id: UUID (optional)
  created_at: TIMESTAMP
  click_count: INT (default 0)
  last_clicked_at: TIMESTAMP
}
```

**Indexes:**
- `short_code` (unique lookup)
- `user_id` (user isolation)
- `created_at` (time-based queries)

**RLS Policies:**
- Users can only view/create/update their own short links
- Service role can manage all links (for redirects)

### API Endpoints

#### 1. Create Short Link
**POST** `/functions/v1/short-link-create`

**Request:**
```json
{
  "originalUrl": "https://example.com/campaign?utm_source=tiktok"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "short_code": "a7F3kL",
  "short_url": "https://{base_url}/functions/v1/short-link-redirect/a7F3kL",
  "original_url": "https://example.com/campaign?utm_source=tiktok",
  "created_at": "2026-02-01T12:00:00Z",
  "click_count": 0
}
```

**Status Codes:**
- `201` - Short link created
- `400` - Invalid URL or rate limit details
- `401` - Unauthorized (missing/invalid token)
- `429` - Rate limited (100 links per hour)
- `500` - Server error

#### 2. Redirect to Original URL
**GET** `/functions/v1/short-link-redirect/{short_code}`

**Behavior:**
1. Look up short link by code
2. Increment click_count
3. Update last_clicked_at
4. Record click in `smart_link_clicks` table
5. Return 302 redirect to original_url

**Analytics Captured:**
- Browser type
- Device type (Mobile/Desktop/Tablet)
- Country/Continent
- Referrer
- User-Agent
- IP address
- Click timestamp

**Status Codes:**
- `302` - Redirect (with Location header)
- `404` - Short code not found
- `500` - Server error

### Security Features

#### Input Validation
- ✅ URL protocol whitelist (http, https only)
- ✅ Block JavaScript, data, vbscript protocols
- ✅ Block inline event handlers (onclick, onerror)
- ✅ URL length limits (max 4096 chars)
- ✅ Short code format validation (6-8 alphanumeric)

#### Open Redirect Prevention
- ✅ Strict URL parsing and validation
- ✅ Protocol whitelist enforcement
- ✅ No relative URL support
- ✅ Suspicious pattern detection

#### Rate Limiting
- ✅ Max 100 short links per user per hour
- ✅ Prevents abuse and spam

#### Authentication
- ✅ JWT token validation on create
- ✅ User isolation via RLS policies
- ✅ Service role authorization for tracking

#### Collision Prevention
- ✅ Unique short code constraint
- ✅ Automatic retry on collision (up to 5 attempts)
- ✅ Cryptographically random generation

### Short Code Generation

**Algorithm:**
1. Generate 6-8 character code from base62 alphabet (0-9a-zA-Z)
2. Use `crypto.getRandomValues()` for randomness
3. Check database for uniqueness
4. Retry up to 5 times on collision
5. Throw error if unable to generate unique code

**Examples:**
- `a7F3kL` (6 chars)
- `zXm9Qp7` (7 chars)
- `B2nC8Ts` (7 chars)

## Frontend Integration

### Component: ShortLinkDisplay

Located in `src/components/links/ShortLinkDisplay.tsx`

**Props:**
```typescript
interface ShortLinkDisplayProps {
  originalUrl: string;           // URL to create short link for
  linkId?: string;              // Optional: Link ID for analytics
  onShortLinkCreated?: callback; // Optional: Callback after creation
}
```

**Features:**
- "Generate Short Link" button
- Display short code with click count
- Expandable view with full URL
- "Copy URL" button (copies to clipboard)
- "Regenerate" button (creates new short link)

### Usage in LinkCard

```tsx
<ShortLinkDisplay 
  originalUrl={link.url}
  linkId={link.id}
/>
```

### Integration with Links Page

Short links are displayed in each link card with:
1. One-click generation
2. Click count display
3. Copy functionality
4. Regeneration option

## Analytics Integration

### Click Tracking

Short link clicks are recorded in the existing `smart_link_clicks` table:

```sql
INSERT INTO smart_link_clicks (
  destination_url,
  merchant_id,      -- User who created the short link
  referrer,
  user_agent,
  ip_address,
  browser,
  device_type,
  country,
  continent,
  clicked_at
) VALUES (...)
```

### Analytics Dashboard

Short link clicks automatically feed into:
- **AnalyticsOverview**: Total clicks, platforms, devices
- **AdvancedAnalytics**: Detailed breakdown by geography, browser, device
- **Analytics by Link**: Per-link analytics including short link redirects

### Campaign Attribution

Original tracking parameters are preserved:

```
Original: https://example.com?utm_source=tiktok&utm_campaign=launch
Short:    https://{base}/functions/v1/short-link-redirect/a7F3kL
          ↓ (302 redirect) ↓
Result:   https://example.com?utm_source=tiktok&utm_campaign=launch
```

Click is recorded with:
- Destination URL (with parameters)
- Browser/Device/Country data
- Referrer information

## Production Checklist

### Database
- [x] Migration created: `20260201000000_short_links_system.sql`
- [x] RLS policies configured
- [x] Indexes created for performance
- [x] Constraints validated

### Backend
- [x] Short code generation: `short-link-utils.ts`
- [x] Redirect endpoint: `/short-link-redirect/index.ts`
- [x] Create endpoint: `/short-link-create/index.ts`
- [x] URL validation and security checks
- [x] Analytics integration with `smart_link_clicks`
- [x] Rate limiting (100 per hour)
- [x] Error handling and logging

### Frontend
- [x] URL validation utility: `lib/url-validation.ts`
- [x] ShortLinkDisplay component
- [x] LinkCard integration
- [x] Copy to clipboard functionality
- [x] Error handling and toast notifications

### Security
- [x] URL protocol whitelist
- [x] Open redirect prevention
- [x] JavaScript/data protocol blocking
- [x] Event handler detection
- [x] Rate limiting
- [x] User isolation via RLS
- [x] JWT validation

### Testing Needed
- [ ] Create short link with various URLs
- [ ] Verify redirect with 302 status
- [ ] Check analytics recording
- [ ] Test rate limiting
- [ ] Verify short code uniqueness
- [ ] Test malicious URL rejection
- [ ] Test open redirect prevention
- [ ] Verify user isolation
- [ ] Test regeneration flow

## Performance Optimizations

### Database
- **Short code lookup:** O(1) via unique index
- **User's links:** O(1) via user_id index
- **Recent links:** O(1) via created_at index

### Caching Opportunities
- Short link metadata could be cached (TTL: 24h)
- Redirect could use short-lived cache for frequent links
- Analytics aggregation could be cached hourly

### Query Optimization
- Select only needed columns
- Use count: 'exact' for pagination
- Batch operations where possible

## Usage Examples

### Creating a Short Link Programmatically

```typescript
const response = await fetch('/functions/v1/short-link-create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    originalUrl: 'https://my-site.com/product?ref=campaign&id=123'
  })
});

const shortLink = await response.json();
console.log(`Short: ${shortLink.short_url}`);
console.log(`Code:  ${shortLink.short_code}`);
```

### Using Short Links in Campaigns

1. Create campaign with original URL (includes UTM params)
2. Generate short link via dashboard
3. Share short link on social media
4. Clicks redirect to original URL (parameters intact)
5. Analytics dashboard shows clicks by device/country/browser

## Troubleshooting

### "Rate limit exceeded" Error
- User has created >100 short links in past hour
- Wait for hourly window to reset
- Or contact admin to increase limit

### Short link not redirecting
- Verify short code exists in database
- Check that original_url is valid
- Ensure no network issues
- Check browser console for errors

### Clicks not appearing in analytics
- Verify short link was created successfully
- Check that clicks are being recorded in `smart_link_clicks`
- Wait a few seconds for real-time sync
- Check analytics date range filter

### URL validation errors
- Ensure URL starts with `http://` or `https://`
- Check URL doesn't contain `javascript:` or `data:`
- Verify URL length is under 4096 characters
- Test URL in browser first

## Future Enhancements

1. **Custom Short Codes:** Allow users to specify custom codes
2. **Domain Customization:** Use branded domain (e.g., `ly.nk/code`)
3. **Link Expiration:** Set expiration date or click limit
4. **Password Protection:** Require password to follow short link
5. **QR Code Generation:** Generate QR codes for short links
6. **Bulk Operations:** Create multiple short links at once
7. **Link Groups:** Organize short links by campaign
8. **Advanced Analytics:** Deep dive reports per short link
9. **Webhooks:** Notify on milestone events (1K clicks, etc.)
10. **API Keys:** Allow third-party integrations

## Files Modified/Created

```
supabase/
  migrations/
    20260201000000_short_links_system.sql (NEW)
  functions/
    short-link-utils.ts (NEW)
    short-link-create/
      index.ts (NEW)
    short-link-redirect/
      index.ts (NEW)

src/
  lib/
    url-validation.ts (NEW)
  components/links/
    ShortLinkDisplay.tsx (NEW)
    LinkCard.tsx (MODIFIED - added ShortLinkDisplay)
```

## References

- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Row Level Security:** https://supabase.com/docs/guides/auth/row-level-security
- **URL API:** https://developer.mozilla.org/en-US/docs/Web/API/URL
- **Security Best Practices:** https://owasp.org/www-community/attacks/Open_Redirect
