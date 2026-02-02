-- Comprehensive cleanup: Remove all Shopify-related code and restore simple policies
-- This migration removes merchants table references and shop_domain columns from links

-- First, drop all the restrictive RLS policies that check for active merchants
DROP POLICY IF EXISTS "Users can view their own links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can create links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can view clicks for their links in their shops" ON public.link_clicks;

-- Drop the trigger that auto-assigns shop_domain
DROP TRIGGER IF EXISTS assign_shop_to_link_trigger ON public.links;
DROP FUNCTION IF EXISTS public.assign_shop_to_link();

-- Remove shop_domain columns from links (if they exist)
ALTER TABLE public.links DROP COLUMN IF EXISTS shop_domain;

-- Remove shop_domain columns from link_clicks (if they exist)
ALTER TABLE public.link_clicks DROP COLUMN IF EXISTS shop_domain;

-- Restore simple, user-based RLS policies
CREATE POLICY "Users can view their own links"
  ON public.links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links"
  ON public.links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
  ON public.links FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
  ON public.links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view clicks for their links"
  ON public.link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = link_clicks.link_id
      AND links.user_id = auth.uid()
    )
  );

-- Anyone can insert clicks (for public link tracking)
CREATE POLICY "Anyone can insert clicks"
  ON public.link_clicks FOR INSERT
  WITH CHECK (true);

-- Drop indexes on shop_domain if they exist
DROP INDEX IF EXISTS idx_links_shop_domain;
DROP INDEX IF EXISTS idx_link_clicks_shop_domain;
