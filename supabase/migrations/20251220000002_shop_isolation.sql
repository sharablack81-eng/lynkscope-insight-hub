-- Optimize data model for multi-merchant Shopify app
-- Ensures strict shop isolation, clean install/uninstall handling, and no cross-merchant data leakage

-- CRITICAL: Add UNIQUE constraint on shop_domain
-- This ensures one shop can only be connected to one merchant account
-- Prevents data leakage and duplicate connections
ALTER TABLE public.merchants 
ADD CONSTRAINT merchants_shop_domain_unique UNIQUE (shop_domain) 
WHERE shop_domain IS NOT NULL;

-- Add shop_domain to links table for shop isolation
-- This ensures links are scoped to specific shops
-- Required for proper cleanup on uninstall
-- Note: No foreign key constraint because shop_domain can be NULL (for links before shop connection)
-- and we need to allow NULL when shop is uninstalled
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS shop_domain TEXT;

-- Add shop_domain to link_clicks for shop isolation
-- This ensures click data is properly scoped
-- Note: link_clicks already has CASCADE delete via link_id, but shop_domain provides additional isolation
ALTER TABLE public.link_clicks 
ADD COLUMN IF NOT EXISTS shop_domain TEXT;

-- Update link_clicks.shop_domain from links when link is created/updated
-- This maintains referential integrity
CREATE OR REPLACE FUNCTION public.sync_link_clicks_shop_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Update all clicks for this link to have the same shop_domain
  UPDATE public.link_clicks
  SET shop_domain = NEW.shop_domain
  WHERE link_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync shop_domain to link_clicks when link is created/updated
DROP TRIGGER IF EXISTS sync_link_clicks_shop_domain_trigger ON public.links;
CREATE TRIGGER sync_link_clicks_shop_domain_trigger
AFTER INSERT OR UPDATE OF shop_domain ON public.links
FOR EACH ROW
WHEN (NEW.shop_domain IS NOT NULL)
EXECUTE FUNCTION public.sync_link_clicks_shop_domain();

-- Update existing link_clicks to have shop_domain from their links
UPDATE public.link_clicks
SET shop_domain = (
  SELECT links.shop_domain 
  FROM public.links 
  WHERE links.id = link_clicks.link_id
)
WHERE shop_domain IS NULL;

-- Create indexes for shop isolation queries
CREATE INDEX IF NOT EXISTS idx_links_shop_domain ON public.links(shop_domain) WHERE shop_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_link_clicks_shop_domain ON public.link_clicks(shop_domain) WHERE shop_domain IS NOT NULL;

-- Update RLS policies to include shop isolation
-- Users can only access links for shops they own

-- Drop existing link policies
DROP POLICY IF EXISTS "Users can view their own links" ON public.links;
DROP POLICY IF EXISTS "Users can create their own links" ON public.links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.links;

-- Create shop-isolated link policies
-- Links must belong to user AND shop must belong to user
CREATE POLICY "Users can view their own links for their shops"
  ON public.links FOR SELECT
  USING (
    auth.uid() = user_id 
    AND (
      shop_domain IS NULL 
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  );

CREATE POLICY "Users can create links for their shops"
  ON public.links FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  );

CREATE POLICY "Users can update their own links for their shops"
  ON public.links FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (
      shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  );

CREATE POLICY "Users can delete their own links for their shops"
  ON public.links FOR DELETE
  USING (
    auth.uid() = user_id
    AND (
      shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  );

-- Update link_clicks policy to include shop isolation
DROP POLICY IF EXISTS "Users can view clicks for their links" ON public.link_clicks;

CREATE POLICY "Users can view clicks for their links in their shops"
  ON public.link_clicks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = link_clicks.link_id
      AND links.user_id = auth.uid()
      AND (
        links.shop_domain IS NULL
        OR EXISTS (
          SELECT 1 FROM public.merchants
          WHERE merchants.shop_domain = links.shop_domain
          AND merchants.user_id = auth.uid()
          AND merchants.token_status = 'active'
        )
      )
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN public.links.shop_domain IS 'Shop domain this link belongs to. NULL for links created before shop connection.';
COMMENT ON COLUMN public.link_clicks.shop_domain IS 'Shop domain for this click. Denormalized from links for performance.';
COMMENT ON CONSTRAINT merchants_shop_domain_unique ON public.merchants IS 'Ensures one shop can only be connected to one merchant account. Prevents data leakage.';

-- Function to clean up shop data on uninstall
-- This is called by the webhook handler when app is uninstalled
-- CRITICAL: This ensures complete data cleanup on uninstall (required for App Store approval)
CREATE OR REPLACE FUNCTION public.cleanup_shop_data(p_shop_domain TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_link_ids UUID[];
BEGIN
  -- Get all link IDs for this shop (for cascading deletes)
  SELECT ARRAY_AGG(id) INTO v_link_ids
  FROM public.links
  WHERE shop_domain = p_shop_domain;
  
  -- Delete any A/B tests for links in this shop
  -- Must delete before links (foreign key constraint)
  IF v_link_ids IS NOT NULL AND array_length(v_link_ids, 1) > 0 THEN
    DELETE FROM public.ab_tests
    WHERE variant_a_id = ANY(v_link_ids)
       OR variant_b_id = ANY(v_link_ids);
    
    -- Delete any expire links for links in this shop
    DELETE FROM public.expire_links
    WHERE link_id = ANY(v_link_ids);
  END IF;
  
  -- Delete all links for this shop
  -- This will cascade delete link_clicks via foreign key
  DELETE FROM public.links
  WHERE shop_domain = p_shop_domain;
  
  -- Defensive cleanup: Delete any orphaned clicks (shouldn't happen, but safe)
  DELETE FROM public.link_clicks
  WHERE shop_domain = p_shop_domain
  AND link_id NOT IN (SELECT id FROM public.links);
  
  -- Note: Merchant record and tokens are cleaned up by webhook handler
  -- This function only cleans up shop-scoped data (links, clicks, A/B tests, expire links)
END;
$$;

-- Add comment for cleanup function
COMMENT ON FUNCTION public.cleanup_shop_data IS 'Cleans up all shop-scoped data on app uninstall. Called by webhook handler.';

-- Update ab_tests RLS policies to include shop isolation
-- Users can only access A/B tests for links in their shops

DROP POLICY IF EXISTS "Users can view their own ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Users can create their own ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Users can update their own ab tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Users can delete their own ab tests" ON public.ab_tests;

CREATE POLICY "Users can view their own ab tests for their shops"
ON public.ab_tests FOR SELECT
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = ab_tests.variant_a_id
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can create their own ab tests for their shops"
ON public.ab_tests FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = ab_tests.variant_a_id
    AND links.user_id = auth.uid()
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can update their own ab tests for their shops"
ON public.ab_tests FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = ab_tests.variant_a_id
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can delete their own ab tests for their shops"
ON public.ab_tests FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = ab_tests.variant_a_id
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

-- Update expire_links RLS policies to include shop isolation
-- Users can only access expire links for links in their shops

DROP POLICY IF EXISTS "Users can view their own expire links" ON public.expire_links;
DROP POLICY IF EXISTS "Users can create their own expire links" ON public.expire_links;
DROP POLICY IF EXISTS "Users can update their own expire links" ON public.expire_links;
DROP POLICY IF EXISTS "Users can delete their own expire links" ON public.expire_links;

CREATE POLICY "Users can view their own expire links for their shops"
ON public.expire_links FOR SELECT
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = expire_links.link_id
    AND links.user_id = auth.uid()
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can create their own expire links for their shops"
ON public.expire_links FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = expire_links.link_id
    AND links.user_id = auth.uid()
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can update their own expire links for their shops"
ON public.expire_links FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = expire_links.link_id
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

CREATE POLICY "Users can delete their own expire links for their shops"
ON public.expire_links FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.links
    WHERE links.id = expire_links.link_id
    AND (
      links.shop_domain IS NULL
      OR EXISTS (
        SELECT 1 FROM public.merchants
        WHERE merchants.shop_domain = links.shop_domain
        AND merchants.user_id = auth.uid()
        AND merchants.token_status = 'active'
      )
    )
  )
);

