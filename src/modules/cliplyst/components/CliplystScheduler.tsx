import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, XCircle, Loader, Clock } from "lucide-react";
import { useCliplystSchedules } from "../hooks/useCliplystSchedules";
import { format } from "date-fns";

const PLATFORMS = ["TikTok", "Instagram Reels", "YouTube Shorts", "YouTube", "X / Twitter"];

export function CliplystScheduler() {
  const { schedules, isLoading, createSchedule, cancelSchedule } =
    useCliplystSchedules();
  const [platform, setPlatform] = useState("TikTok");
  const [scheduledAt, setScheduledAt] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const handleCreate = async () => {
    if (!scheduledAt) return;
    await createSchedule({
      platform,
      scheduled_at: new Date(scheduledAt).toISOString(),
      webhook_url: webhookUrl || undefined,
    });
    setScheduledAt("");
    setWebhookUrl("");
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary",
    published: "bg-green-500/10 text-green-600",
    cancelled: "bg-destructive/10 text-destructive",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Create schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule Post
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
              <label className="text-sm font-medium">Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Webhook URL{" "}
              <span className="text-muted-foreground font-normal">(optional — Zapier, etc.)</span>
            </label>
            <Input
              placeholder="https://hooks.zapier.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={!scheduledAt} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Schedule list */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : schedules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No scheduled posts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.scheduled_at), "PPp")}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${statusColors[s.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {s.status}
                  </Badge>
                  {s.status === "scheduled" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => cancelSchedule(s.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
