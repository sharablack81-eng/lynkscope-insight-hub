-- Remove the overly permissive INSERT policy that allows anyone to insert clicks
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.link_clicks;

-- The track-click edge function uses the service role key which bypasses RLS,
-- so it will still be able to insert click records while preventing direct client abuse