-- Create A/B tests table
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  variant_a_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  variant_b_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  winner_variant TEXT CHECK (winner_variant IN ('A', 'B'))
);

-- Add conversion tracking to link_clicks
ALTER TABLE public.link_clicks 
ADD COLUMN converted BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS on ab_tests
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for ab_tests
CREATE POLICY "Users can view their own ab tests"
ON public.ab_tests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ab tests"
ON public.ab_tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ab tests"
ON public.ab_tests
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ab tests"
ON public.ab_tests
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX idx_link_clicks_converted ON public.link_clicks(converted);