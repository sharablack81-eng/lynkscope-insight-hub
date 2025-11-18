import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateExpireLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateExpireLinkDialog = ({ isOpen, onClose, onSuccess }: CreateExpireLinkDialogProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [expireType, setExpireType] = useState<"time-based" | "day-based" | "click-based">("time-based");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [maxClicks, setMaxClicks] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name || !url) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate short code
      const shortCode = Math.random().toString(36).substring(2, 8);

      // Determine platform based on URL
      let platform = "Other";
      if (url.includes("tiktok")) platform = "TikTok";
      else if (url.includes("youtube")) platform = "YouTube";
      else if (url.includes("instagram")) platform = "Instagram";
      else if (url.includes("twitter") || url.includes("x.com")) platform = "Twitter";

      // Create the link
      const { data: link, error: linkError } = await supabase
        .from("links")
        .insert({
          user_id: user.id,
          title: name,
          url: url,
          short_code: shortCode,
          platform: platform,
        })
        .select()
        .single();

      if (linkError) throw linkError;

      // Calculate expiry time
      let expiresAt: string | null = null;
      let maxClicksValue: number | null = null;

      if (expireType === "time-based") {
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const expiryDate = new Date(Date.now() + totalSeconds * 1000);
        expiresAt = expiryDate.toISOString();
      } else if (expireType === "day-based") {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + years);
        expiryDate.setMonth(expiryDate.getMonth() + months);
        expiryDate.setDate(expiryDate.getDate() + days);
        expiresAt = expiryDate.toISOString();
      } else if (expireType === "click-based") {
        maxClicksValue = maxClicks;
      }

      // Create expire link entry
      const { error: expireError } = await supabase
        .from("expire_links")
        .insert({
          user_id: user.id,
          link_id: link.id,
          name: name,
          expire_type: expireType,
          expires_at: expiresAt,
          max_clicks: maxClicksValue,
          is_active: true,
        });

      if (expireError) throw expireError;

      toast({
        title: "Success!",
        description: "Expire link created successfully",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error creating expire link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create expire link",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setExpireType("time-based");
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    setYears(0);
    setMonths(0);
    setDays(0);
    setMaxClicks(100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Auto-Expire Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Link Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Sale Campaign"
            />
          </div>

          <div>
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label>Expiry Type</Label>
            <Tabs value={expireType} onValueChange={(v) => setExpireType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="time-based">Time-Based</TabsTrigger>
                <TabsTrigger value="day-based">Day-Based</TabsTrigger>
                <TabsTrigger value="click-based">Click-Based</TabsTrigger>
              </TabsList>

              <TabsContent value="time-based" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minutes">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="seconds">Seconds</Label>
                    <Input
                      id="seconds"
                      type="number"
                      min="0"
                      max="59"
                      value={seconds}
                      onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="day-based" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="years">Years</Label>
                    <Input
                      id="years"
                      type="number"
                      min="0"
                      value={years}
                      onChange={(e) => setYears(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="months">Months</Label>
                    <Input
                      id="months"
                      type="number"
                      min="0"
                      max="11"
                      value={months}
                      onChange={(e) => setMonths(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="days">Days</Label>
                    <Input
                      id="days"
                      type="number"
                      min="0"
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="click-based" className="space-y-4">
                <div>
                  <Label htmlFor="maxClicks">Maximum Clicks</Label>
                  <Input
                    id="maxClicks"
                    type="number"
                    min="1"
                    value={maxClicks}
                    onChange={(e) => setMaxClicks(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link will expire after this many clicks
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExpireLinkDialog;
