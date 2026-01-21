import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TestTube, Clock, Plus, TrendingUp, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/backend";
import { useToast } from "@/hooks/use-toast";
import CreateABTestDialog from "./CreateABTestDialog";
import CreateExpireLinkDialog from "./CreateExpireLinkDialog";
import { getClickCountForLink } from "@/lib/analytics";

const SmartAutomation = () => {
  const [abTests, setAbTests] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [expireLinks, setExpireLinks] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpireLinkDialogOpen, setIsExpireLinkDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { toast } = useToast();

  // Use link.user_id (the link OWNER) for merchant attribution, NOT the current user
  const getSmartUrl = (link?: { id?: string; url?: string; user_id?: string } | null) => {
    if (!link?.url || !link?.user_id) return "";
    const base = `${window.location.origin}/#/r?url=${encodeURIComponent(link.url)}${link.id ? `&linkId=${link.id}` : ""}`;
    return `${base}&mid=${link.user_id}`;
  };

  const copyToClipboard = async (link?: { id?: string; url?: string } | null) => {
    const url = getSmartUrl(link);

    if (!url) {
      toast({
        title: "Nothing to copy",
        description: "This item is missing a destination URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard",
      });
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const fetchABTests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: testsData, error: testsError } = await supabase
        .from("ab_tests")
        .select(`
          *,
          variant_a:links!variant_a_id(*),
          variant_b:links!variant_b_id(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (testsError) throw testsError;

      // Fetch click data for each test using unified analytics
      const enrichedTests = await Promise.all(
        (testsData || []).map(async (test) => {
          const [clicksACount, clicksBCount] = await Promise.all([
            getClickCountForLink(test.variant_a_id),
            getClickCountForLink(test.variant_b_id)
          ]);

          const totalClicks = clicksACount + clicksBCount;

          // CTR is percentage of total clicks each variant gets
          const ctrA = totalClicks > 0 ? (clicksACount / totalClicks) * 100 : 0;
          const ctrB = totalClicks > 0 ? (clicksBCount / totalClicks) * 100 : 0;

          // Note: conversion tracking would need additional implementation
          // For now, using click counts as primary metric
          const conversionA = 0;
          const conversionB = 0;

          return {
            ...test,
            clicksA: clicksACount,
            clicksB: clicksBCount,
            ctrA: Number(ctrA.toFixed(1)),
            ctrB: Number(ctrB.toFixed(1)),
            conversionA,
            conversionB,
          };
        })
      );

      setAbTests(enrichedTests);
    } catch (error: any) {
      console.error("Error fetching A/B tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      console.error("Error fetching links:", error);
    }
  };

  /**
   * Determine A/B test winner using priority:
   * 1. Higher CTR (click-through rate)
   * 2. If CTR is equal, use higher conversion rate
   * 3. If both equal, use higher total clicks
   */
  const determineWinner = (test: any): "A" | "B" => {
    // Priority 1: CTR
    if (test.ctrA !== test.ctrB) {
      return test.ctrA > test.ctrB ? "A" : "B";
    }
    
    // Priority 2: Conversion rate
    if (test.conversionA !== test.conversionB) {
      return test.conversionA > test.conversionB ? "A" : "B";
    }
    
    // Priority 3: Total clicks
    return test.clicksA >= test.clicksB ? "A" : "B";
  };

  const handleEndTest = async (testId: string, test: any) => {
    try {
      const winner = determineWinner(test);

      const { error } = await supabase
        .from("ab_tests")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          winner_variant: winner,
        })
        .eq("id", testId);

      if (error) throw error;

      toast({
        title: "Test ended",
        description: `Variant ${winner} is the winner!`,
      });

      fetchABTests();
    } catch (error: any) {
      toast({
        title: "Error ending test",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchExpireLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: expireLinksData, error: expireLinksError } = await supabase
        .from("expire_links")
        .select(`
          *,
          link:links(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (expireLinksError) throw expireLinksError;

      // Enrich with click data using unified analytics
      const enrichedExpireLinks = await Promise.all(
        (expireLinksData || []).map(async (expireLink) => {
          const clickCount = await getClickCountForLink(expireLink.link_id);

          // Check if expired
          let isExpired = false;
          if (expireLink.expire_type === "time-based" || expireLink.expire_type === "day-based") {
            isExpired = expireLink.expires_at && new Date(expireLink.expires_at) < new Date();
          } else if (expireLink.expire_type === "click-based") {
            isExpired = clickCount >= (expireLink.max_clicks || 0);
          }

          return {
            ...expireLink,
            clickCount,
            conversions: 0, // Would need additional tracking
            conversionRate: 0,
            isExpired,
          };
        })
      );

      setExpireLinks(enrichedExpireLinks);
    } catch (error: any) {
      console.error("Error fetching expire links:", error);
    }
  };

  const handleToggleExpireLink = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("expire_links")
        .update({ is_active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Link ${!currentActive ? "activated" : "deactivated"}`,
      });

      fetchExpireLinks();
    } catch (error: any) {
      console.error("Error toggling expire link:", error);
      toast({
        title: "Error",
        description: "Failed to toggle link",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  useEffect(() => {
    fetchABTests();
    fetchLinks();
    fetchExpireLinks();
  }, []);

  const getWinner = (test: typeof abTests[0]) => {
    if (test.status !== "ended") return null;
    return test.winner_variant || determineWinner(test);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* A/B Testing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col min-h-0"
      >
        <Card className="premium-card flex flex-col h-full">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TestTube className="w-4 h-4 text-primary" />
                A/B Testing
              </CardTitle>
              <Button 
                size="sm"
                className="gradient-purple glow-purple hover:glow-purple-strong h-8"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Test
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 px-4 py-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Loading tests...
              </div>
            ) : abTests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No A/B tests yet. Create your first test!
              </div>
            ) : (
              abTests.map((test, index) => {
              const winner = getWinner(test);
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="premium-card p-3 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{test.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {test.variant_a?.short_code} vs {test.variant_b?.short_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <Badge 
                        variant={test.status === "active" ? "default" : "secondary"}
                        className={`text-xs px-1.5 py-0.5 ${test.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}`}
                      >
                        {test.status === "active" ? "Active" : "Ended"}
                      </Badge>
                      {test.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => handleEndTest(test.id, test)}
                        >
                          End
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Variant A */}
                    <div className={`p-2 rounded-md bg-card/50 border ${winner === "A" ? "border-primary glow-purple" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">A ({test.variant_a?.platform})</span>
                        {winner === "A" && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0">Winner</Badge>
                        )}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clicks</span>
                          <span className="font-semibold">{test.clicksA.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CTR</span>
                          <span className="font-semibold flex items-center gap-0.5">
                            {test.ctrA}%
                            <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-border">
                        <div className="flex items-center gap-1">
                          <code className="flex-1 px-1.5 py-1 bg-muted rounded text-[10px] truncate">
                            {getSmartUrl(test.variant_a)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(test.variant_a)}
                          >
                            {copiedLink === getSmartUrl(test.variant_a) ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-2 rounded-md bg-card/50 border ${winner === "B" ? "border-primary glow-purple" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium">B ({test.variant_b?.platform})</span>
                        {winner === "B" && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1 py-0">Winner</Badge>
                        )}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clicks</span>
                          <span className="font-semibold">{test.clicksB.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CTR</span>
                          <span className="font-semibold flex items-center gap-0.5">
                            {test.ctrB}%
                            <TrendingUp className="w-2.5 h-2.5 text-green-500" />
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-border">
                        <div className="flex items-center gap-1">
                          <code className="flex-1 px-1.5 py-1 bg-muted rounded text-[10px] truncate">
                            {getSmartUrl(test.variant_b)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(test.variant_b)}
                          >
                            {copiedLink === getSmartUrl(test.variant_b) ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Auto-Expire Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col min-h-0"
      >
        <Card className="premium-card flex flex-col h-full">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-primary" />
                Auto-Expire Links
              </CardTitle>
              <Button 
                size="sm"
                className="gradient-purple glow-purple hover:glow-purple-strong h-8"
                onClick={() => setIsExpireLinkDialogOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Create
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3 px-4 py-2">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Loading expire links...
              </div>
            ) : expireLinks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No expire links yet. Create your first one!
              </div>
            ) : (
              expireLinks.map((expireLink, index) => {
                const progressValue = expireLink.expire_type === "click-based" 
                  ? (expireLink.clickCount / (expireLink.max_clicks || 1)) * 100 
                  : expireLink.expires_at ? Math.max(0, 100 - ((new Date(expireLink.expires_at).getTime() - Date.now()) / (new Date(expireLink.expires_at).getTime() - new Date(expireLink.created_at).getTime())) * 100) : 0;

                return (
                  <motion.div
                    key={expireLink.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="premium-card p-3 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold truncate">{expireLink.name}</h3>
                          <Switch
                            checked={expireLink.is_active && !expireLink.isExpired}
                            disabled={expireLink.isExpired}
                            onCheckedChange={() => handleToggleExpireLink(expireLink.id, expireLink.is_active)}
                            className="scale-75"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{expireLink.link?.url}</p>
                      </div>
                      <Badge 
                        variant={expireLink.is_active && !expireLink.isExpired ? "default" : "secondary"}
                        className={`text-xs px-1.5 py-0.5 ml-2 ${
                          expireLink.expire_type === "click-based" 
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30" 
                            : expireLink.expire_type === "time-based"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                        }`}
                      >
                        {expireLink.expire_type === "click-based" ? "Clicks" : expireLink.expire_type === "time-based" ? "Time" : "Days"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {expireLink.expire_type === "click-based" 
                            ? `${expireLink.clickCount}/${expireLink.max_clicks} clicks` 
                            : expireLink.isExpired
                            ? "Expired"
                            : `${getTimeRemaining(expireLink.expires_at)} left`}
                        </span>
                        <span className="font-medium">{Math.round(Math.min(100, progressValue))}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, progressValue)} 
                        className="h-1.5"
                      />

                      {expireLink.isExpired && (
                        <Badge variant="destructive" className="w-full justify-center text-xs py-0.5">
                          Expired
                        </Badge>
                      )}

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-1">
                          <code className="flex-1 px-1.5 py-1 bg-muted rounded text-[10px] truncate">
                            {getSmartUrl(expireLink.link)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(expireLink.link)}
                          >
                            {copiedLink === getSmartUrl(expireLink.link) ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.div>

      <CreateABTestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        links={links}
        onTestCreated={fetchABTests}
      />

      <CreateExpireLinkDialog
        isOpen={isExpireLinkDialogOpen}
        onClose={() => setIsExpireLinkDialogOpen(false)}
        onSuccess={fetchExpireLinks}
      />
    </div>
  );
};

export default SmartAutomation;
