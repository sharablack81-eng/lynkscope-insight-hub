import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CliplystTrend {
  id: string;
  user_id: string;
  niche: string;
  platform: string;
  title: string;
  description: string | null;
  source_url: string | null;
  trend_score: number | null;
  is_selected: boolean;
  scraped_at: string;
  expires_at: string | null;
  created_at: string;
}

export function useCliplystTrends(niche: string | null) {
  const [trends, setTrends] = useState<CliplystTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  const fetchTrends = useCallback(async () => {
    if (!niche) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cliplyst_trends")
      .select("*")
      .eq("niche", niche)
      .order("trend_score", { ascending: false });

    if (error) console.error(error);
    else setTrends((data as unknown as CliplystTrend[]) || []);
    setIsLoading(false);
  }, [niche]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const scrapeTrends = async (platform?: string) => {
    if (!niche) { toast.error("Set your niche in Settings first"); return; }
    setIsScraping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("cliplyst-fetch-trends", {
        body: { niche, platform },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const body = res.data as { trends?: CliplystTrend[] };
      setTrends(body.trends || []);
      toast.success("Trends updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch trends");
    } finally {
      setIsScraping(false);
    }
  };

  const toggleSelect = async (id: string, selected: boolean) => {
    await (supabase
      .from("cliplyst_trends") as any)
      .update({ is_selected: selected })
      .eq("id", id);
    setTrends((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_selected: selected } : t))
    );
  };

  return { trends, isLoading, isScraping, scrapeTrends, toggleSelect, refetch: fetchTrends };
}
