
-- =============================================
-- CLIPLYST MODULE — Database Schema
-- =============================================

-- 1. Storage bucket for videos and clips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cliplyst-media', 'cliplyst-media', false, 20971520, ARRAY['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']);

-- Storage RLS: users can manage their own files
CREATE POLICY "Users can upload cliplyst media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cliplyst-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their cliplyst media"
ON storage.objects FOR SELECT
USING (bucket_id = 'cliplyst-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their cliplyst media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cliplyst-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their cliplyst media"
ON storage.objects FOR DELETE
USING (bucket_id = 'cliplyst-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Platforms reference table
CREATE TABLE public.cliplyst_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  max_duration_seconds integer DEFAULT 60,
  aspect_ratio text DEFAULT '9:16',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platforms are readable by authenticated users"
ON public.cliplyst_platforms FOR SELECT TO authenticated USING (true);

-- Seed platforms
INSERT INTO public.cliplyst_platforms (name, icon, max_duration_seconds, aspect_ratio) VALUES
  ('TikTok', 'music', 180, '9:16'),
  ('Instagram Reels', 'instagram', 90, '9:16'),
  ('YouTube Shorts', 'youtube', 60, '9:16'),
  ('YouTube', 'youtube', 600, '16:9'),
  ('Facebook Reels', 'facebook', 90, '9:16'),
  ('X / Twitter', 'twitter', 140, '16:9');

-- 3. Videos (uploaded source videos)
CREATE TABLE public.cliplyst_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  thumbnail_path text,
  duration_seconds numeric,
  file_size_bytes bigint,
  mime_type text,
  status text NOT NULL DEFAULT 'uploaded',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own videos" ON public.cliplyst_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own videos" ON public.cliplyst_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own videos" ON public.cliplyst_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own videos" ON public.cliplyst_videos FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cliplyst_videos_user ON public.cliplyst_videos (user_id);

-- 4. Clips (generated from source videos)
CREATE TABLE public.cliplyst_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid REFERENCES public.cliplyst_videos(id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text,
  start_time numeric DEFAULT 0,
  end_time numeric,
  duration_seconds numeric,
  platform_id uuid REFERENCES public.cliplyst_platforms(id),
  status text NOT NULL DEFAULT 'pending',
  ai_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own clips" ON public.cliplyst_clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clips" ON public.cliplyst_clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clips" ON public.cliplyst_clips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clips" ON public.cliplyst_clips FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cliplyst_clips_user ON public.cliplyst_clips (user_id);
CREATE INDEX idx_cliplyst_clips_video ON public.cliplyst_clips (video_id);

-- 5. Trends (scraped trending topics)
CREATE TABLE public.cliplyst_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  niche text NOT NULL,
  platform text NOT NULL,
  title text NOT NULL,
  description text,
  source_url text,
  trend_score numeric DEFAULT 0,
  is_selected boolean DEFAULT false,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own trends" ON public.cliplyst_trends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trends" ON public.cliplyst_trends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trends" ON public.cliplyst_trends FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trends" ON public.cliplyst_trends FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cliplyst_trends_user_niche ON public.cliplyst_trends (user_id, niche);

-- 6. Captions (AI-generated)
CREATE TABLE public.cliplyst_captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clip_id uuid REFERENCES public.cliplyst_clips(id) ON DELETE SET NULL,
  trend_id uuid REFERENCES public.cliplyst_trends(id) ON DELETE SET NULL,
  platform text NOT NULL,
  caption_text text NOT NULL,
  hashtags text[] DEFAULT '{}',
  tone text DEFAULT 'engaging',
  seo_score numeric,
  is_selected boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_captions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own captions" ON public.cliplyst_captions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own captions" ON public.cliplyst_captions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own captions" ON public.cliplyst_captions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own captions" ON public.cliplyst_captions FOR DELETE USING (auth.uid() = user_id);

-- 7. Scheduled posts (Buffer-style scheduling)
CREATE TABLE public.cliplyst_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clip_id uuid REFERENCES public.cliplyst_clips(id) ON DELETE CASCADE,
  caption_id uuid REFERENCES public.cliplyst_captions(id) ON DELETE SET NULL,
  platform text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  webhook_url text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cliplyst_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own schedules" ON public.cliplyst_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own schedules" ON public.cliplyst_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own schedules" ON public.cliplyst_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own schedules" ON public.cliplyst_schedules FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cliplyst_schedules_user ON public.cliplyst_schedules (user_id);
CREATE INDEX idx_cliplyst_schedules_status ON public.cliplyst_schedules (status, scheduled_at);

-- 8. Updated_at triggers for Cliplyst tables
CREATE OR REPLACE FUNCTION public.cliplyst_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_cliplyst_videos_updated_at
BEFORE UPDATE ON public.cliplyst_videos
FOR EACH ROW EXECUTE FUNCTION public.cliplyst_update_updated_at();

CREATE TRIGGER trg_cliplyst_clips_updated_at
BEFORE UPDATE ON public.cliplyst_clips
FOR EACH ROW EXECUTE FUNCTION public.cliplyst_update_updated_at();

CREATE TRIGGER trg_cliplyst_schedules_updated_at
BEFORE UPDATE ON public.cliplyst_schedules
FOR EACH ROW EXECUTE FUNCTION public.cliplyst_update_updated_at();

-- 9. Trend score calculation function
CREATE OR REPLACE FUNCTION public.cliplyst_calculate_trend_score(
  _engagement numeric DEFAULT 0,
  _velocity numeric DEFAULT 0,
  _relevance numeric DEFAULT 0
)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ROUND((_engagement * 0.4 + _velocity * 0.35 + _relevance * 0.25)::numeric, 2)
$$;
