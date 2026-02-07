import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Sparkles, Copy, Trash2, Loader } from "lucide-react";
import { useCliplystCaptions } from "../hooks/useCliplystCaptions";
import { useBusinessProfile } from "@/contexts/BusinessContext";
import { toast } from "sonner";

const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts", "YouTube", "X / Twitter"];
const TONES = ["engaging", "professional", "casual", "humorous", "educational"];

export function CliplystCaptions() {
  const { businessNiche } = useBusinessProfile();
  const niche = businessNiche || "";
  const { captions, isLoading, isGenerating, generateCaptions, deleteCaption } =
    useCliplystCaptions();
  const [platform, setPlatform] = useState("TikTok");
  const [tone, setTone] = useState("engaging");

  const handleGenerate = () => {
    if (!niche) {
      toast.error("Set your niche in Settings first");
      return;
    }
    generateCaptions(platform, niche, { tone });
  };

  const copyCaption = (text: string, hashtags: string[]) => {
    const full = `${text}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(full);
    toast.success("Copied!");
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Captions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <Loader className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating…" : "Generate 5 Captions"}
          </Button>
        </CardContent>
      </Card>

      {/* Caption list */}
      <Card>
        <CardHeader>
          <CardTitle>Your Captions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : captions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No captions yet. Generate some above!
            </p>
          ) : (
            <div className="space-y-4">
              {captions.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-lg border border-border space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{c.caption_text}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyCaption(c.caption_text, c.hashtags)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteCaption(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.hashtags?.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{h}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.platform}</span>
                    <span>·</span>
                    <span>{c.tone}</span>
                    {c.seo_score != null && (
                      <>
                        <span>·</span>
                        <span>SEO: {c.seo_score}/100</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
