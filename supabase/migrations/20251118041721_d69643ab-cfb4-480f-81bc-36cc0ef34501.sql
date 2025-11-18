-- Create expire links table
CREATE TABLE public.expire_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expire_type TEXT NOT NULL CHECK (expire_type IN ('time-based', 'day-based', 'click-based')),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_clicks INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expire_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expire links"
ON public.expire_links
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expire links"
ON public.expire_links
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expire links"
ON public.expire_links
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expire links"
ON public.expire_links
FOR DELETE
USING (auth.uid() = user_id);