-- Fix RLS policies for links table to allow non-Shopify users
-- Drop the overly restrictive shop-isolated policies
DROP POLICY IF EXISTS "Users can view their own links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can create links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links for their shops" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links for their shops" ON public.links;

-- Create simpler policies that allow all users to manage their links
-- regardless of whether they have an active Shopify merchant connection
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
