-- Create table for query-parameter smart-link click tracking (no lookup required)
CREATE TABLE IF NOT EXISTS public.smart_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  destination_url TEXT NOT NULL,
  merchant_id UUID NULL,
  link_id UUID NULL,
  referrer TEXT NULL,
  user_agent TEXT NULL,
  ip_address TEXT NULL,
  browser TEXT NULL,
  device_type TEXT NULL,
  country TEXT NULL,
  continent TEXT NULL,
  CONSTRAINT smart_link_clicks_destination_url_len CHECK (char_length(destination_url) BETWEEN 1 AND 4096)
);

-- Optional relation to saved links (keeps existing analytics intact when provided)
ALTER TABLE public.smart_link_clicks
  ADD CONSTRAINT smart_link_clicks_link_id_fkey
  FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_clicked_at ON public.smart_link_clicks (clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_merchant_id ON public.smart_link_clicks (merchant_id);
CREATE INDEX IF NOT EXISTS idx_smart_link_clicks_link_id ON public.smart_link_clicks (link_id);

ALTER TABLE public.smart_link_clicks ENABLE ROW LEVEL SECURITY;

-- Read-only access for owners
CREATE POLICY "Users can view smart link clicks by merchant"
ON public.smart_link_clicks
FOR SELECT
USING (merchant_id IS NOT NULL AND auth.uid() = merchant_id);

CREATE POLICY "Users can view smart link clicks for their links"
ON public.smart_link_clicks
FOR SELECT
USING (
  link_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.links
    WHERE links.id = smart_link_clicks.link_id
      AND links.user_id = auth.uid()
  )
);
