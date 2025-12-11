-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired');

-- Create merchants table for subscription tracking
CREATE TABLE public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  shopify_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own merchant record"
ON public.merchants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant record"
ON public.merchants FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_merchants_updated_at
BEFORE UPDATE ON public.merchants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create merchant record on signup
CREATE OR REPLACE FUNCTION public.handle_new_merchant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.merchants (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to auto-create merchant on user signup
CREATE TRIGGER on_auth_user_created_merchant
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_merchant();