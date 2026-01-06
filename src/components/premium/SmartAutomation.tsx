import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TestTube, Clock, Plus, TrendingUp, TrendingDown, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CreateABTestDialog from "./CreateABTestDialog";
import CreateExpireLinkDialog from "./CreateExpireLinkDialog";

const SmartAutomation = () => {
  const [abTests, setAbTests] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [expireLinks, setExpireLinks] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExpireLinkDialogOpen, setIsExpireLinkDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>("");
  const { toast } = useToast();

  const getSmartUrl = (link?: { id?: string; url?: string } | null) => {
    if (!link?.url) return "";
    const base = `${window.location.origin}/r?url=${encodeURIComponent(link.url)}${link.id ? `&linkId=${link.id}` : ""}`;
    return merchantId ? `${base}&mid=${merchantId}` : base;
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

      // Fetch click data for each test
      const enrichedTests = await Promise.all(
        (testsData || []).map(async (test) => {
          const { data: clicksA } = await supabase
            .from("link_clicks")
            .select("*")
            .eq("link_id", test.variant_a_id);

          const { data: clicksB } = await supabase
            .from("link_clicks")
            .select("*")
            .eq("link_id", test.variant_b_id);

          const clicksACount = clicksA?.length || 0;
          const clicksBCount = clicksB?.length || 0;
          const totalClicks = clicksACount + clicksBCount;

          const conversionsA = clicksA?.filter(c => c.converted).length || 0;
          const conversionsB = clicksB?.filter(c => c.converted).length || 0;

          const ctrA = totalClicks > 0 ? (clicksACount / totalClicks) * 100 : 0;
          const ctrB = totalClicks > 0 ? (clicksBCount / totalClicks) * 100 : 0;

          const conversionRateA = clicksACount > 0 ? (conversionsA / clicksACount) * 100 : 0;
          const conversionRateB = clicksBCount > 0 ? (conversionsB / clicksBCount) * 100 : 0;

          return {
            ...test,
            clicksA: clicksACount,
            clicksB: clicksBCount,
            ctrA: Number(ctrA.toFixed(1)),
            ctrB: Number(ctrB.toFixed(1)),
            conversionA: Number(conversionRateA.toFixed(1)),
            conversionB: Number(conversionRateB.toFixed(1)),
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

  const handleEndTest = async (testId: string, test: any) => {
    try {
      const winner = test.conversionB > test.conversionA ? "B" : "A";

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

      // Enrich with click data
      const enrichedExpireLinks = await Promise.all(
        (expireLinksData || []).map(async (expireLink) => {
          const { data: clicks } = await supabase
            .from("link_clicks")
            .select("*")
            .eq("link_id", expireLink.link_id);

          const clickCount = clicks?.length || 0;
          const conversions = clicks?.filter(c => c.converted).length || 0;
          const conversionRate = clickCount > 0 ? (conversions / clickCount) * 100 : 0;

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
            conversions,
            conversionRate: Number(conversionRate.toFixed(1)),
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
    supabase.auth.getUser().then(({ data: { user } }) => setMerchantId(user?.id ?? ""));
    fetchABTests();
    fetchLinks();
    fetchExpireLinks();
  }, []);

  const [expiringLinks, setExpiringLinks] = useState([
    {
      id: 1,
      name: "flash-sale-2024",
      url: "example.com/flash-sale",
      expireType: "clicks",
      maxClicks: 1000,
      currentClicks: 742,
      enabled: true,
    },
    {
      id: 2,
      name: "limited-offer",
      url: "example.com/limited",
      expireType: "time",
      expiryDate: "2024-12-31",
      daysLeft: 14,
      enabled: true,
    },
    {
      id: 3,
      name: "beta-access",
      url: "example.com/beta",
      expireType: "clicks",
      maxClicks: 500,
      currentClicks: 423,
      enabled: false,
    },
  ]);

  const getWinner = (test: typeof abTests[0]) => {
    if (test.status !== "ended") return null;
    return test.conversionB > test.conversionA ? "B" : "A";
  };

  return (
    <div className="space-y-6">
      {/* A/B Testing Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                A/B Testing
              </CardTitle>
              <Button 
                className="gradient-purple glow-purple hover:glow-purple-strong"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Test
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading tests...
              </div>
            ) : abTests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No A/B tests yet. Create your first test to get started!
              </div>
            ) : (
              abTests.map((test, index) => {
              const winner = getWinner(test);
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="premium-card p-6 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {test.variant_a?.short_code} vs {test.variant_b?.short_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={test.status === "active" ? "default" : "secondary"}
                        className={test.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}
                      >
                        {test.status === "active" ? "Active" : "Ended"}
                      </Badge>
                      {test.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEndTest(test.id, test)}
                        >
                          End Test
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Variant A */}
                    <div className={`p-4 rounded-lg bg-card/50 border ${winner === "A" ? "border-primary glow-purple" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Variant A ({test.variant_a?.platform})</span>
                        {winner === "A" && (
                          <Badge className="bg-primary text-primary-foreground">Winner</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Clicks</span>
                          <span className="font-semibold">{test.clicksA.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CTR</span>
                          <span className="font-semibold flex items-center gap-1">
                            {test.ctrA}%
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversion</span>
                          <span className="font-semibold">{test.conversionA}%</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs truncate">
                            {getSmartUrl(test.variant_a)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(test.variant_a)}
                          >
                            {copiedLink === getSmartUrl(test.variant_a) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-4 rounded-lg bg-card/50 border ${winner === "B" ? "border-primary glow-purple" : "border-border"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Variant B ({test.variant_b?.platform})</span>
                        {winner === "B" && (
                          <Badge className="bg-primary text-primary-foreground">Winner</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Clicks</span>
                          <span className="font-semibold">{test.clicksB.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CTR</span>
                          <span className="font-semibold flex items-center gap-1">
                            {test.ctrB}%
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Conversion</span>
                          <span className="font-semibold">{test.conversionB}%</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs truncate">
                            {getSmartUrl(test.variant_b)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(test.variant_b)}
                          >
                            {copiedLink === getSmartUrl(test.variant_b) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
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
        transition={{ delay: 0.2 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Auto-Expire Links
              </CardTitle>
              <Button 
                className="gradient-purple glow-purple hover:glow-purple-strong"
                onClick={() => setIsExpireLinkDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Expire Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading expire links...
              </div>
            ) : expireLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expire links yet. Create your first expire link to get started!
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
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="premium-card p-5 rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{expireLink.name}</h3>
                          <Switch
                            checked={expireLink.is_active && !expireLink.isExpired}
                            disabled={expireLink.isExpired}
                            onCheckedChange={() => handleToggleExpireLink(expireLink.id, expireLink.is_active)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{expireLink.link?.url}</p>
                      </div>
                      <Badge 
                        variant={expireLink.is_active && !expireLink.isExpired ? "default" : "secondary"}
                        className={
                          expireLink.expire_type === "click-based" 
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30" 
                            : expireLink.expire_type === "time-based"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                        }
                      >
                        {expireLink.expire_type === "click-based" ? "Click-based" : expireLink.expire_type === "time-based" ? "Time-based" : "Day-based"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">Total Clicks</span>
                          <span className="font-semibold">{expireLink.clickCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Conversions</span>
                          <span className="font-semibold">{expireLink.conversions}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Conv. Rate</span>
                          <span className="font-semibold">{expireLink.conversionRate}%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {expireLink.expire_type === "click-based" 
                              ? `${expireLink.clickCount} / ${expireLink.max_clicks} clicks` 
                              : expireLink.isExpired
                              ? "Expired"
                              : `${getTimeRemaining(expireLink.expires_at)} remaining`}
                          </span>
                          <span className="font-medium">{Math.round(Math.min(100, progressValue))}%</span>
                        </div>
                        <Progress 
                          value={Math.min(100, progressValue)} 
                          className="h-2"
                        />
                      </div>

                      {expireLink.isExpired && (
                        <Badge variant="destructive" className="w-full justify-center">
                          Link Expired
                        </Badge>
                      )}

                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Share this link:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs truncate">
                            {getSmartUrl(expireLink.link)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => copyToClipboard(expireLink.link)}
                          >
                            {copiedLink === getSmartUrl(expireLink.link) ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
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
