-- Function to automatically assign shop_domain to links when created
-- This ensures new links are properly scoped to the user's active shop
CREATE OR REPLACE FUNCTION public.assign_shop_to_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_shop_domain TEXT;
BEGIN
  -- If shop_domain is already set, don't override
  IF NEW.shop_domain IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the user's active shop domain
  SELECT merchants.shop_domain INTO v_shop_domain
  FROM public.merchants
  WHERE merchants.user_id = NEW.user_id
    AND merchants.token_status = 'active'
    AND merchants.shop_domain IS NOT NULL
  LIMIT 1;
  
  -- Assign shop_domain if user has an active shop
  IF v_shop_domain IS NOT NULL THEN
    NEW.shop_domain := v_shop_domain;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically assign shop_domain when link is created
DROP TRIGGER IF EXISTS assign_shop_to_link_trigger ON public.links;
CREATE TRIGGER assign_shop_to_link_trigger
BEFORE INSERT ON public.links
FOR EACH ROW
EXECUTE FUNCTION public.assign_shop_to_link();

-- Add comment for documentation
COMMENT ON FUNCTION public.assign_shop_to_link IS 'Automatically assigns shop_domain to new links based on user''s active shop connection.';

