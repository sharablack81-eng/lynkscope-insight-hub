# Environment Setup Guide

## Secure Credential Management

This document outlines how to properly configure sensitive credentials for the Lynkscope ↔ Cliplyst integration.

### 1. Local Development (`.env.local`)

**Location:** `.env.local` (automatically git-ignored)

The `.env.local` file has been created with the following credentials:

```env
# Cliplyst API Integration
VITE_CLIPLYST_API_URL=https://cliplyst-content-maker.onrender.com

# Lynkscope ↔ Cliplyst Shared Credentials
VITE_LYNKSCOPE_INTERNAL_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6

# Session Token Signing
JWT_SECRET=0123456789abcdef0123456789abcdef
```

**Security Considerations:**
- ✅ `.env.local` is in `.gitignore` - never committed to git
- ✅ Only loaded during local development
- ✅ Isolated from version control
- ✅ Never share or commit this file

### 2. Supabase Edge Functions

Environment variables for Edge Functions are configured in `supabase/config.toml`:

```toml
[functions.cliplyst-session]
verify_jwt = false
CLIPLYST_API_URL = "https://cliplyst-content-maker.onrender.com"
JWT_SECRET = "0123456789abcdef0123456789abcdef"
LYNKSCOPE_INTERNAL_KEY = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
```

**How It Works:**
- Edge Functions read these variables via `Deno.env.get()`
- Configuration is stored locally in `config.toml` for development
- For production: Use Supabase dashboard → Project Settings → Edge Functions → Environment Variables

### 3. Variable Usage Guide

| Variable | Type | Location | Purpose |
|----------|------|----------|---------|
| `VITE_CLIPLYST_API_URL` | Public | Client-side | Cliplyst API endpoint URL |
| `VITE_LYNKSCOPE_INTERNAL_KEY` | Client-visible | Client-side | Bearer token for Cliplyst API requests |
| `JWT_SECRET` | Secret | Backend only | Signing session tokens (Supabase Functions) |

### 4. Production Deployment

#### Render.com
1. Go to your project settings
2. Navigate to "Environment"
3. Add each variable:
   - `VITE_CLIPLYST_API_URL`
   - `VITE_LYNKSCOPE_INTERNAL_KEY`
   - `JWT_SECRET`

#### Supabase (Edge Functions)
1. Go to Supabase dashboard
2. Select your project
3. Navigate to Settings → Edge Functions
4. Set environment variables for `cliplyst-session` function:
   - `JWT_SECRET`
   - `LYNKSCOPE_INTERNAL_KEY`
   - `CLIPLYST_API_URL`

#### Vercel
1. Project Settings → Environment Variables
2. Add variables for different environments (Development, Preview, Production)
3. Deploy to apply changes

### 5. Security Best Practices

✅ **Do:**
- Store `.env.local` locally only
- Use strong, cryptographically secure secrets in production
- Rotate secrets periodically
- Never log sensitive values
- Use different keys for dev/staging/production

❌ **Don't:**
- Commit `.env.local` to git
- Share credentials via Slack, email, or unencrypted channels
- Hardcode secrets in source code
- Use weak or predictable secret values
- Reuse production secrets across environments

### 6. Verification Checklist

- [ ] `.env.local` created with correct credentials
- [ ] `supabase/config.toml` updated with environment variables
- [ ] Cliplyst session function validates JWT_SECRET and LYNKSCOPE_INTERNAL_KEY on startup
- [ ] Production environment variables configured in deployment platform
- [ ] No credentials visible in git history
- [ ] Team members have access to `.env.local` via secure channel (not git)

### 7. Troubleshooting

**Error: "JWT_SECRET environment variable is not configured"**
- Check `supabase/config.toml` has JWT_SECRET defined
- Verify Supabase environment variables are set in dashboard
- Run `supabase functions download` to sync from cloud

**Error: "LYNKSCOPE_INTERNAL_KEY must be set"**
- Ensure `supabase/config.toml` includes LYNKSCOPE_INTERNAL_KEY
- Verify Bearer token is passed correctly in Cliplyst API calls

**Cliplyst integration not working locally**
- Check `.env.local` exists in project root
- Verify `VITE_CLIPLYST_API_URL` is accessible
- Test with: `curl -I https://cliplyst-content-maker.onrender.com`

### 8. Credential Rotation

To rotate credentials:
1. Generate new keys/secrets
2. Update `.env.local` locally
3. Update `supabase/config.toml` for Edge Functions
4. Update production environment variables in deployment platforms
5. Verify all services working with new credentials
6. Document rotation date in team wiki/notes

---

**Last Updated:** February 1, 2026  
**Maintained By:** Development Team
