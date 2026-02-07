import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CliplystVideo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCliplystVideos() {
  const [videos, setVideos] = useState<CliplystVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cliplyst_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load videos");
      console.error(error);
    } else {
      setVideos((data as unknown as CliplystVideo[]) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const uploadVideo = async (file: File, title: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return null; }

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("cliplyst-media")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      return null;
    }

    const { data: record, error: insertError } = await (supabase
      .from("cliplyst_videos") as any)
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        storage_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: "uploaded",
      })
      .select()
      .single();

    if (insertError) {
      toast.error("Failed to save video record");
      return null;
    }

    toast.success("Video uploaded!");
    await fetchVideos();
    return record as unknown as CliplystVideo;
  };

  const deleteVideo = async (id: string, storagePath: string) => {
    await supabase.storage.from("cliplyst-media").remove([storagePath]);
    const { error } = await supabase.from("cliplyst_videos").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); await fetchVideos(); }
  };

  return { videos, isLoading, uploadVideo, deleteVideo, refetch: fetchVideos };
}
