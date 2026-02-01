# Lynkscope ↔ Cliplyst Integration Guide

## Overview

Lynkscope and Cliplyst are now fully integrated to create an **automated marketing system**:

- **Lynkscope** = Strategic analysis and platform ranking
- **Cliplyst** = Automated content generation and scheduling

When users complete an analysis in Lynkscope, they can instantly send the strategy to Cliplyst to generate optimized content for weak platforms.

---

## Architecture

### Data Flow

```
User clicks "Analyze Marketing"
         ↓
Lynkscope AI analyzes performance
         ↓
Shows platform rankings and insights
         ↓
User clicks "Generate Content with Cliplyst"
         ↓
Sends strategy via POST to Cliplyst
         ↓
Cliplyst generates and schedules content
```

### Integration Points

1. **AIAssistant Component** (`src/components/ai/AIAssistant.tsx`)
   - Fetches user analytics
   - Calls Lynkscope AI analysis
   - Stores user data in localStorage for Cliplyst

2. **AnalysisDisplay Component** (`src/components/ai/AnalysisDisplay.tsx`)
   - Shows analysis results
   - Displays "Generate Content with Cliplyst" button
   - Sends data to Cliplyst when clicked

3. **Cliplyst Connector Service** (`src/lib/cliplystConnectorService.ts`)
   - Handles API communication with Cliplyst
   - Manages authentication
   - Handles errors gracefully

---

## API Specification

### Lynkscope → Cliplyst Request

**Endpoint**: `POST https://cliplyst-content-maker.onrender.com/api/automation/create`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer LYNKSCOPE_INTERNAL_KEY"
}
```

**Request Body**:
```json
{
  "user_id": "uuid",
  "company_name": "Business Name",
  "niche": "Industry/Niche",
  "weak_platforms": ["Instagram", "TikTok"],
  "top_opportunities": ["LinkedIn", "YouTube"],
  "auto_schedule": true,
  "posting_frequency": "daily",
  "source": "lynkscope",
  "timestamp": "2025-02-01T12:00:00Z"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Content automation started",
  "automation_id": "auto_abc123def456",
  "status": "processing"
}
```

**Response** (Error - 400-500):
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed explanation"
}
```

---

## Environment Variables

### Required

#### `VITE_CLIPLYST_API_URL`
- **Type**: URL
- **Default**: `https://cliplyst-content-maker.onrender.com`
- **Purpose**: Cliplyst API endpoint
- **Where to set**: `.env.local` (development) or CI/CD secrets (production)

#### `VITE_LYNKSCOPE_INTERNAL_KEY`
- **Type**: Secret API Key
- **Format**: Bearer token
- **Purpose**: Authenticate requests from Lynkscope to Cliplyst
- **Security**: NEVER commit to git, NEVER expose in frontend
- **Where to get**: Cliplyst team provides this during setup
- **Where to set**: `.env.local` only (NOT in public `.env`)

### Optional

#### `VITE_SUPABASE_URL`
- Already configured for other Lynkscope features

#### `VITE_ANTHROPIC_API_KEY`
- Already configured for AI analysis

---

## Setup Instructions

### 1. Get Cliplyst Internal Key
Contact the Cliplyst team to receive `LYNKSCOPE_INTERNAL_KEY`.

### 2. Configure Environment Variables

**Local Development** (`.env.local`):
```env
VITE_CLIPLYST_API_URL=https://cliplyst-content-maker.onrender.com
VITE_LYNKSCOPE_INTERNAL_KEY=your-key-from-cliplyst-team
```

**Production** (CI/CD Secrets):
- Set in your deployment platform (Vercel, Netlify, etc.)
- Variable name: `VITE_LYNKSCOPE_INTERNAL_KEY`
- Variable name: `VITE_CLIPLYST_API_URL`

### 3. Verify Configuration

```bash
# Test in browser console:
import { getCliplystStatus } from '@/lib/cliplystConnectorService'
getCliplystStatus()

# Should output:
# {
#   configured: true,
#   apiUrl: "https://cliplyst-content-maker.onrender.com",
#   hasApiKey: true
# }
```

### 4. Test Integration

1. Log in to Lynkscope
2. Navigate to Dashboard or AI Assistant
3. Click "Analyze Marketing"
4. Wait for analysis to complete
5. Should see "Generate Content with Cliplyst" button
6. Click button and verify success message

---

## User Flow

### Step 1: Analyze Marketing
1. User opens AI Assistant (floating button)
2. Clicks "Summarize my marketing data"
3. Lynkscope AI analyzes platform performance
4. Results show platform rankings

### Step 2: Review Strategy
- Shows:
  - Platform rankings (score, performance level)
  - Weak platforms (below average performance)
  - Top opportunities (excellent performers)
  - AI recommendations for improvement

### Step 3: Generate Content
1. User sees "Generate Content with Cliplyst" button
2. Button is only visible if Cliplyst is configured
3. User clicks button
4. Status shows "Sending..." while uploading
5. Cliplyst processes and generates content
6. Success message shows automation ID

### Step 4: Cliplyst Execution
- Cliplyst receives strategy
- Identifies weak platforms
- Generates optimized content
- Schedules posts automatically
- User receives updates in Cliplyst dashboard

---

## Component Implementation

### AnalysisDisplay Component

```typescript
// Shows analysis results + Cliplyst button
<AnalysisDisplay analysis={analysisResult} />

// Displays:
// - Platform rankings with color coding
// - Key insights and recommendations
// - "Generate Content with Cliplyst" button (if configured)
// - Status messages during/after sending
```

**Features**:
- Automatic weak/strong platform detection
- Loading state during send
- Success/error status messages
- Disabled state after successful send
- Only shows button if Cliplyst is configured

### Cliplyst Connector Service

```typescript
// Send strategy to Cliplyst
const result = await sendToCliplyst({
  user_id: "123",
  company_name: "Acme Inc",
  niche: "Tech",
  weak_platforms: ["Instagram", "TikTok"],
  top_opportunities: ["LinkedIn"],
  auto_schedule: true,
  posting_frequency: "daily"
});

// Returns:
// {
//   success: true,
//   message: "...",
//   automation_id: "auto_xxx",
//   status: "processing"
// }
```

**Error Handling**:
- Validates all required fields
- Checks if API key is configured
- Handles network errors gracefully
- Returns descriptive error messages
- Logs details to console for debugging

---

## Security Considerations

### API Key Protection

✅ **CORRECT**:
```env
# .env.local (development)
VITE_LYNKSCOPE_INTERNAL_KEY=sk_lynk_internal_key

# CI/CD Secret (production)
VITE_LYNKSCOPE_INTERNAL_KEY=sk_lynk_internal_key
```

❌ **WRONG**:
```typescript
// NEVER hardcode API key
const apiKey = "sk_lynk_internal_key"; // ❌ WRONG!

// NEVER expose in frontend
export const CLIPLYST_KEY = "sk_lynk_internal_key"; // ❌ WRONG!

// NEVER commit .env file
// .env (with actual keys) // ❌ WRONG!
```

### Request Validation

- Service validates all required fields before sending
- Returns 400 error if missing data
- Prevents sending incomplete data to Cliplyst

### Signature Verification

- Cliplyst can optionally sign responses
- Lynkscope should validate response integrity
- Use webhook secret for HMAC-SHA256 verification

---

## Testing

### Local Testing

1. **Setup**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with real Cliplyst keys
   npm run dev
   ```

2. **Test Flow**:
   - Open http://localhost:5173
   - Log in
   - Navigate to Dashboard
   - Click "Analyze Marketing"
   - Wait for analysis
   - Click "Generate Content with Cliplyst"
   - Verify success message

3. **Debug**:
   - Open browser console
   - Check for logs starting with `[Cliplyst]`
   - Verify network tab shows POST request
   - Check response payload

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| API key missing | Shows error: "Cliplyst integration not configured" |
| Network error | Shows error: Network/server error message |
| Cliplyst returns 400 | Shows error from Cliplyst response |
| Cliplyst returns 500 | Shows error: "Cliplyst API error" |
| Missing user data | Shows error: "User analysis data not found" |

### Test Payloads

**Payload 1**: Minimal valid payload
```json
{
  "user_id": "test-user-1",
  "company_name": "Test Company",
  "niche": "Technology",
  "weak_platforms": ["Instagram"],
  "top_opportunities": ["LinkedIn"],
  "auto_schedule": true,
  "posting_frequency": "daily"
}
```

**Payload 2**: Full payload with all fields
```json
{
  "user_id": "user-uuid",
  "company_name": "Acme Inc",
  "niche": "B2B SaaS",
  "weak_platforms": ["Instagram", "TikTok", "Pinterest"],
  "top_opportunities": ["LinkedIn", "Twitter", "YouTube"],
  "auto_schedule": true,
  "posting_frequency": "twice-daily",
  "source": "lynkscope",
  "timestamp": "2025-02-01T12:00:00Z"
}
```

---

## Troubleshooting

### Issue: Button not showing

**Cause**: Cliplyst not configured
```typescript
isCliplystConfigured() // returns false
```

**Fix**:
- Check `.env.local` has `VITE_LYNKSCOPE_INTERNAL_KEY`
- Verify key is not empty
- Restart dev server

### Issue: "Cliplyst integration not configured"

**Cause**: `VITE_LYNKSCOPE_INTERNAL_KEY` is not set

**Fix**:
```bash
# Add to .env.local
VITE_LYNKSCOPE_INTERNAL_KEY=your-actual-key
```

### Issue: Network error / 404

**Cause**: Wrong Cliplyst API URL

**Fix**:
- Verify `VITE_CLIPLYST_API_URL` is correct
- Check endpoint is `/api/automation/create`
- Verify Cliplyst server is running

### Issue: 401 Unauthorized

**Cause**: Invalid API key

**Fix**:
- Verify key with Cliplyst team
- Check key format (should be `sk_lynk_...`)
- Ensure `Authorization: Bearer` header is sent correctly

### Issue: Missing fields error from Cliplyst

**Cause**: Incomplete payload

**Fix**:
- Run analysis first to populate user data
- Check localStorage: `localStorage.getItem('lynkscope_user_analysis')`
- Verify all required fields are present

### Issue: "User analysis data not found"

**Cause**: Analysis not run yet

**Fix**:
- Click "Analyze Marketing" first
- Wait for analysis to complete
- Then click Cliplyst button

---

## Monitoring

### Client-side Logs

Enable console logging:
```typescript
// Check browser console for [Cliplyst] logs
localStorage.setItem('DEBUG', 'true');
// Then run analysis again
```

**Log Examples**:
```
[Cliplyst] Sending strategy to: https://...
[Cliplyst] Payload: { company_name: "...", ... }
[Cliplyst] Success: { message: "...", automation_id: "..." }
[Cliplyst] Error: "Network error"
```

### Server-side Logs

View Cliplyst logs:
- Cliplyst dashboard/logs
- Check for incoming requests from `lynkscope`
- Verify webhook is firing on success

### Metrics to Track

- Successful sends per day
- Error rate
- Average response time
- Most common errors
- Platform distribution in sent strategies

---

## API Reference

### CliplystPayload Interface

```typescript
interface CliplystPayload {
  user_id: string;              // User ID from Supabase Auth
  company_name: string;         // Business name
  niche: string;               // Industry/niche
  weak_platforms: string[];    // Platforms to focus on
  top_opportunities: string[]; // High-performing platforms
  auto_schedule: boolean;      // Enable auto-scheduling
  posting_frequency: string;   // daily, weekly, etc.
}
```

### CliplystResponse Interface

```typescript
interface CliplystResponse {
  success: boolean;           // Request succeeded
  message: string;           // Human-readable message
  automation_id?: string;    // ID of automation if successful
  status?: string;          // Status (processing, pending, etc.)
  error?: string;          // Error message if failed
}
```

### Service Methods

#### `sendToCliplyst(payload: CliplystPayload): Promise<CliplystResponse>`
Send strategy to Cliplyst for content generation.

#### `isCliplystConfigured(): boolean`
Check if Cliplyst integration is configured.

#### `getCliplystStatus(): { configured: boolean; apiUrl: string; hasApiKey: boolean }`
Get current configuration status.

---

## File Structure

```
src/
├── lib/
│   └── cliplystConnectorService.ts    ← API communication
├── components/
│   └── ai/
│       ├── AIAssistant.tsx            ← Analysis trigger
│       └── AnalysisDisplay.tsx        ← Cliplyst button + status
└── integration/
    └── supabase/
        └── client.ts
```

---

## Related Documentation

- [Stripe Billing System](./STRIPE_BILLING_IMPLEMENTATION.md) - Payment processing
- [AI Marketing Assistant](./AI_MARKETING_ASSISTANT.md) - Analysis engine
- [Supabase Integration](./src/integrations/supabase/README.md) - Backend setup

---

## Support & Escalation

### Common Issues

See **Troubleshooting** section above.

### Cliplyst Support

Contact Cliplyst team for:
- API key issues
- Endpoint configuration
- Content generation failures
- Automation status

### Lynkscope Support

Contact Lynkscope team for:
- Frontend integration issues
- Lynkscope API errors
- User flow problems
- Configuration questions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 1, 2025 | Initial implementation |

---

**Status**: ✅ Production Ready  
**Last Updated**: February 1, 2025  
**Maintained By**: Development Team
