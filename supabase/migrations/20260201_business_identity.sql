-- Add business identity fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_niche TEXT;

-- Add constraints
ALTER TABLE public.profiles
ADD CONSTRAINT business_name_not_empty CHECK (business_name IS NULL OR char_length(business_name) > 0),
ADD CONSTRAINT business_niche_not_empty CHECK (business_niche IS NULL OR char_length(business_niche) > 0);

-- Update the handle_new_user function to initialize business fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, business_name, business_niche)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'business_name', ''),
    COALESCE(new.raw_user_meta_data->>'business_niche', '')
  );
  RETURN new;
END;
$$;
