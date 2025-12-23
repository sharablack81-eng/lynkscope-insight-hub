# Shopify OAuth Flow Review & Refactoring

## Issues Found & Fixed

### 🔴 CRITICAL - App Store Rejection Risks

#### 1. **Missing HMAC Verification** ✅ FIXED
- **Issue**: OAuth callback did not verify HMAC signature from Shopify
- **Risk**: App Store rejection - HMAC verification is REQUIRED for security
- **Fix**: Implemented proper HMAC-SHA256 verification following Shopify's exact specification:
  - Extract all query parameters except 'hmac' and 'signature'
  - Sort alphabetically by key
  - Reconstruct query string
  - Calculate HMAC-SHA256 using client secret
  - Constant-time comparison to prevent timing attacks

#### 2. **CORS Wildcard** ✅ FIXED
- **Issue**: `Access-Control-Allow-Origin: '*'` allows any origin
- **Risk**: Security vulnerability and potential App Store rejection
- **Fix**: Restricted to `APP_URL` environment variable only

#### 3. **Missing Shop Domain Validation** ✅ FIXED
- **Issue**: No validation that shop domain is a valid `.myshopify.com` domain
- **Risk**: Security vulnerability - could allow malicious domains
- **Fix**: Added strict regex validation: `/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/`

#### 4. **Weak State Parameter** ✅ FIXED
- **Issue**: State parameter only used base64 encoding, no expiration check
- **Risk**: CSRF attacks possible, replay attacks possible
- **Fix**: 
  - Added cryptographic nonce (random 16 bytes)
  - Added timestamp with expiration check (10 minutes max age)
  - Proper verification function

#### 5. **Sensitive Data in Logs** ✅ FIXED
- **Issue**: Logged shop domains and user IDs that could be sensitive
- **Risk**: Privacy concerns, potential App Store rejection
- **Fix**: Removed sensitive data from logs, only log action types

#### 6. **Error Messages Expose Internal Details** ✅ FIXED
- **Issue**: Error messages exposed database errors, Shopify API errors
- **Risk**: Information leakage, security risk
- **Fix**: Generic error messages to client, detailed errors only server-side

### 🟡 MEDIUM - Best Practices

#### 7. **Missing Reauthorization Flow** ✅ FIXED
- **Issue**: No handling for when merchants need to reauthorize (scope changes, token revocation)
- **Risk**: Poor user experience, potential functionality issues
- **Fix**: Added `reauthorize` action that handles existing connections

#### 8. **Missing Timestamp Verification** ✅ FIXED
- **Issue**: No verification of request timestamp to prevent replay attacks
- **Risk**: Replay attacks possible
- **Fix**: Added timestamp verification (reject requests older than 5 minutes)

#### 9. **Missing Environment Variable Validation** ✅ FIXED
- **Issue**: No validation that required environment variables are set
- **Risk**: Runtime errors in production
- **Fix**: Added `validateEnv()` function that checks all required vars

#### 10. **Incorrect Scope Justification** ⚠️ NEEDS REVIEW
- **Issue**: Requesting `read_products,write_products` but app is a link shortener/analytics tool
- **Risk**: App Store rejection - scopes must match app functionality
- **Action Required**: 
  - Review if product scopes are actually needed
  - If not needed, remove them
  - If needed, document why in App Store listing

### 🟢 MINOR - Code Quality

#### 11. **Missing Method Validation** ✅ FIXED
- **Issue**: No HTTP method validation for install/reauthorize endpoints
- **Fix**: Added explicit POST method checks

#### 12. **Missing Request Body Validation** ✅ FIXED
- **Issue**: No try-catch around JSON parsing
- **Fix**: Added proper error handling for malformed JSON

## Security Improvements

1. **HMAC Verification**: Prevents callback tampering
2. **State Parameter Security**: Prevents CSRF and replay attacks
3. **Shop Domain Validation**: Prevents domain spoofing
4. **Timestamp Verification**: Prevents replay attacks
5. **Constant-Time Comparison**: Prevents timing attacks on HMAC
6. **Restricted CORS**: Prevents unauthorized origins
7. **No Sensitive Data Exposure**: Protects merchant privacy

## Shopify App Store Compliance

✅ **OAuth Flow**: Follows Shopify's recommended OAuth 2.0 flow
✅ **HMAC Verification**: Required security measure implemented
✅ **Error Handling**: Generic errors don't expose internal details
✅ **State Parameter**: Secure, non-replayable state tokens
✅ **Shop Validation**: Strict domain validation
✅ **Reauthorization**: Handles token refresh scenarios

## Testing Checklist

Before submitting to App Store:

- [ ] Test OAuth install flow end-to-end
- [ ] Test OAuth callback with valid HMAC
- [ ] Test OAuth callback with invalid HMAC (should reject)
- [ ] Test OAuth callback with expired state (should reject)
- [ ] Test OAuth callback with invalid shop domain (should reject)
- [ ] Test reauthorization flow
- [ ] Verify CORS headers are restrictive
- [ ] Verify no sensitive data in logs
- [ ] Verify error messages are generic
- [ ] Review scopes - ensure they match app functionality
- [ ] Test with production Shopify app credentials

## Environment Variables Required

```
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=your_app_url (for CORS and redirects)
```

## Notes

- The refactored code is explicit and follows Shopify's documented patterns
- No abstractions or optimizations that could confuse reviewers
- All security measures are clearly documented in comments
- Error handling is defensive and doesn't leak information

