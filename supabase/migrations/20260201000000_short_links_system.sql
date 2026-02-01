-- Create short_links table for branded short link system
CREATE TABLE IF NOT EXISTS public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  click_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  CONSTRAINT short_links_short_code_len CHECK (char_length(short_code) BETWEEN 6 AND 8),
  CONSTRAINT short_links_original_url_len CHECK (char_length(original_url) BETWEEN 1 AND 4096)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_short_links_short_code ON public.short_links (short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON public.short_links (user_id);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own short links
CREATE POLICY "Users can view their own short links"
ON public.short_links
FOR SELECT
USING (user_id = auth.uid());

-- Users can create short links
CREATE POLICY "Users can create short links"
ON public.short_links
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own short links
CREATE POLICY "Users can update their own short links"
ON public.short_links
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own short links
CREATE POLICY "Users can delete their own short links"
ON public.short_links
FOR DELETE
USING (user_id = auth.uid());

-- Allow service role to read/write for tracking (called from functions)
CREATE POLICY "Service role can manage short links"
ON public.short_links
FOR ALL
USING (true)
WITH CHECK (true);
