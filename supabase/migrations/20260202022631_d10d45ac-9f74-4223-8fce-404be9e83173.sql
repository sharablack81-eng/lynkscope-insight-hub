-- Add link_id column to short_links to associate with parent links
ALTER TABLE public.short_links ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES public.links(id) ON DELETE SET NULL;

-- Create index for link_id lookups
CREATE INDEX IF NOT EXISTS idx_short_links_link_id ON public.short_links(link_id);

-- Create index for original_url + user_id lookups (to find existing short links)
CREATE INDEX IF NOT EXISTS idx_short_links_url_user ON public.short_links(original_url, user_id);