-- Add columns to merchants table to store Shopify shop data
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS shop_domain TEXT,
ADD COLUMN IF NOT EXISTS shopify_access_token TEXT;

-- Create index for quick lookups by shop domain
CREATE INDEX IF NOT EXISTS idx_merchants_shop_domain ON public.merchants(shop_domain);