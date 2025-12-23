-- Create table to track processed webhook events for idempotency
-- This prevents duplicate processing of the same webhook delivery
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id TEXT NOT NULL UNIQUE, -- Shopify webhook ID (from X-Shopify-Webhook-Id header)
  shop_domain TEXT NOT NULL,
  topic TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'retrying')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON public.webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_shop_domain ON public.webhook_events(shop_domain);
CREATE INDEX IF NOT EXISTS idx_webhook_events_topic ON public.webhook_events(topic);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);

-- Enable RLS (though this table is server-side only)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access (no client access)
CREATE POLICY "Service role only"
ON public.webhook_events
FOR ALL
USING (false); -- No client access - only service role can access

-- Add comment for documentation
COMMENT ON TABLE public.webhook_events IS 'Tracks processed webhook events for idempotency. Prevents duplicate processing.';
COMMENT ON COLUMN public.webhook_events.webhook_id IS 'Shopify webhook ID from X-Shopify-Webhook-Id header - used for deduplication';
COMMENT ON COLUMN public.webhook_events.status IS 'Event processing status: processed, failed, or retrying';

