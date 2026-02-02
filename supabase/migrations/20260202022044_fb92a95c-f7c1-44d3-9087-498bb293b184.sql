-- Create short_links table for the short link feature
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own short links"
  ON public.short_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short links"
  ON public.short_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own short links"
  ON public.short_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own short links"
  ON public.short_links FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast short_code lookups (used by redirect)
CREATE INDEX idx_short_links_short_code ON public.short_links(short_code);

-- Index for user queries
CREATE INDEX idx_short_links_user_id ON public.short_links(user_id);