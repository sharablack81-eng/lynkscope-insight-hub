-- Add token management columns to merchants table
-- These columns support secure token management and validation

ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS shopify_scopes TEXT,
ADD COLUMN IF NOT EXISTS token_last_validated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS token_status TEXT DEFAULT 'active' CHECK (token_status IN ('active', 'revoked', 'invalid'));

-- Create index for token status lookups
CREATE INDEX IF NOT EXISTS idx_merchants_token_status ON public.merchants(token_status) WHERE token_status IS NOT NULL;

-- Create index for shop domain lookups (for webhook processing)
CREATE INDEX IF NOT EXISTS idx_merchants_shop_domain_active ON public.merchants(shop_domain) WHERE shop_domain IS NOT NULL AND token_status = 'active';

-- Update RLS policy to ensure shopify_access_token is NEVER exposed to client
-- The existing SELECT policy allows users to see their own merchant record
-- But we need to ensure the token column is excluded from client queries
-- This is handled at the application level by never selecting shopify_access_token in client queries

-- Add comment for documentation
COMMENT ON COLUMN public.merchants.shopify_access_token IS 'Shopify access token - NEVER expose to client. Server-side only.';
COMMENT ON COLUMN public.merchants.shopify_scopes IS 'Comma-separated list of granted OAuth scopes';
COMMENT ON COLUMN public.merchants.token_last_validated IS 'Timestamp when token was last validated with Shopify API';
COMMENT ON COLUMN public.merchants.token_status IS 'Token status: active, revoked, or invalid';

