import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CliplystSchedule {
  id: string;
  user_id: string;
  clip_id: string | null;
  caption_id: string | null;
  platform: string;
  scheduled_at: string;
  published_at: string | null;
  status: string;
  webhook_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useCliplystSchedules() {
  const [schedules, setSchedules] = useState<CliplystSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cliplyst_schedules")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) console.error(error);
    else setSchedules((data as unknown as CliplystSchedule[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (schedule: {
    clip_id?: string;
    caption_id?: string;
    platform: string;
    scheduled_at: string;
    webhook_url?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return null; }

    const { data, error } = await (supabase
      .from("cliplyst_schedules") as any)
      .insert({
        user_id: user.id,
        clip_id: schedule.clip_id || null,
        caption_id: schedule.caption_id || null,
        platform: schedule.platform,
        scheduled_at: schedule.scheduled_at,
        webhook_url: schedule.webhook_url || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) { toast.error("Failed to schedule"); return null; }
    toast.success("Scheduled!");
    await fetchSchedules();
    return data as unknown as CliplystSchedule;
  };

  const cancelSchedule = async (id: string) => {
    const { error } = await (supabase
      .from("cliplyst_schedules") as any)
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) toast.error("Cancel failed");
    else { toast.success("Cancelled"); await fetchSchedules(); }
  };

  return { schedules, isLoading, createSchedule, cancelSchedule, refetch: fetchSchedules };
}
