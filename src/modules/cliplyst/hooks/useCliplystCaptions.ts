import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CliplystCaption {
  id: string;
  user_id: string;
  clip_id: string | null;
  trend_id: string | null;
  platform: string;
  caption_text: string;
  hashtags: string[];
  tone: string;
  seo_score: number | null;
  is_selected: boolean;
  created_at: string;
}

export function useCliplystCaptions() {
  const [captions, setCaptions] = useState<CliplystCaption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCaptions = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cliplyst_captions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) console.error(error);
    else setCaptions((data as unknown as CliplystCaption[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const generateCaptions = async (
    platform: string,
    niche: string,
    opts?: { clip_id?: string; trend_id?: string; tone?: string }
  ) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("cliplyst-generate-captions", {
        body: { platform, niche, ...opts },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const body = res.data as { captions?: CliplystCaption[] };
      if (body.captions) {
        setCaptions((prev) => [...body.captions!, ...prev]);
      }
      toast.success("Captions generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteCaption = async (id: string) => {
    const { error } = await supabase.from("cliplyst_captions").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else {
      setCaptions((prev) => prev.filter((c) => c.id !== id));
      toast.success("Deleted");
    }
  };

  return { captions, isLoading, isGenerating, generateCaptions, deleteCaption, refetch: fetchCaptions };
}
