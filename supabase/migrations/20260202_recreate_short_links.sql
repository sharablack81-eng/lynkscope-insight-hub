-- Recreate short_links table with RLS policies matching `links` table
DROP TABLE IF EXISTS public.short_links CASCADE;

CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_short_links_short_code ON public.short_links (short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_user_id ON public.short_links (user_id);
CREATE INDEX IF NOT EXISTS idx_short_links_created_at ON public.short_links (created_at DESC);

-- Enable RLS and add simple user-based policies
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own short links"
  ON public.short_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own short links"
  ON public.short_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own short links"
  ON public.short_links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own short links"
  ON public.short_links FOR DELETE
  USING (auth.uid() = user_id);
