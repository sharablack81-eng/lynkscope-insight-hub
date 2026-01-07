import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  TrendingUp,
  MousePointerClick,
  BarChart3,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [metrics, setMetrics] = useState([
    {
      label: "Total Clicks",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: MousePointerClick
    },
    {
      label: "Top Platform",
      value: "N/A",
      change: "0% of traffic",
      trend: "neutral",
      icon: TrendingUp
    },
    {
      label: "Last 7 Days",
      value: "0",
      change: "0%",
      trend: "neutral",
      icon: BarChart3
    }
  ]);
  const [chartData, setChartData] = useState<number[]>(Array(7).fill(0));
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("user");

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
    handleChargeConfirmation();
  }, []);

  const handleChargeConfirmation = async () => {
    const chargeId = searchParams.get('charge_id');
    const userId = searchParams.get('user_id');
    
    if (chargeId && userId) {
      try {
        // Confirm the charge via edge function
        const { data, error } = await supabase.functions.invoke('shopify-billing', {
          body: null,
        });
        
        // Call with query params for confirmation
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-billing?action=confirm-charge&charge_id=${chargeId}&user_id=${userId}`
        );
        
        const result = await response.json();
        
        if (result.success) {
          toast.success("Subscription activated successfully!");
          // Clear URL params
          navigate('/dashboard', { replace: true });
        } else {
          toast.error("Failed to activate subscription");
        }
      } catch (error) {
        console.error('Charge confirmation error:', error);
        toast.error("Failed to confirm subscription");
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        
        setDisplayName(profile?.display_name || "user");
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all links
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*');

      if (linksError) throw linksError;

      // Fetch all link_clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('link_clicks')
        .select('*');

      if (clicksError) throw clicksError;

      // Also fetch smart_link_clicks for combined analytics
      const { data: smartClicksData, error: smartClicksError } = await supabase
        .from('smart_link_clicks')
        .select('*');

      if (smartClicksError) console.error('Error fetching smart clicks:', smartClicksError);

      // Combine both click sources
      const allClicks = [
        ...(clicksData || []),
        ...(smartClicksData || []).map(sc => ({
          ...sc,
          clicked_at: sc.clicked_at,
          link_id: sc.link_id
        }))
      ];

      const totalClicks = allClicks.length;

      // Calculate last 7 days clicks
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const last7DaysClicks = allClicks.filter(c => {
        const clickDate = new Date(c.clicked_at);
        return clickDate >= sevenDaysAgo;
      }).length;

      // Calculate platform breakdown
      const platformCounts: Record<string, number> = {};
      for (const link of linksData || []) {
        const linkClicks = allClicks.filter(c => c.link_id === link.id).length;
        platformCounts[link.platform] = (platformCounts[link.platform] || 0) + linkClicks;
      }

      const topPlatform = Object.entries(platformCounts).length > 0
        ? Object.entries(platformCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : "N/A";

      const topPlatformPercentage = totalClicks > 0 && topPlatform !== "N/A"
        ? Math.round((platformCounts[topPlatform] / totalClicks) * 100)
        : 0;

      // Calculate chart data for last 7 days
      const chartArray = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayClicks = allClicks.filter(c => {
          const clickDate = new Date(c.clicked_at);
          return clickDate.toDateString() === date.toDateString();
        }).length;
        chartArray.push(dayClicks);
      }

      setMetrics([
        {
          label: "Total Clicks",
          value: totalClicks.toLocaleString(),
          change: "+0%",
          trend: "neutral",
          icon: MousePointerClick
        },
        {
          label: "Top Platform",
          value: topPlatform,
          change: `${topPlatformPercentage}% of traffic`,
          trend: "neutral",
          icon: TrendingUp
        },
        {
          label: "Last 7 Days",
          value: last7DaysClicks.toLocaleString(),
          change: "+0%",
          trend: "neutral",
          icon: BarChart3
        }
      ]);

      setChartData(chartArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const maxChartValue = Math.max(...chartData, 1);

  return (
    <DashboardLayout>
      {/* Dashboard Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Welcome Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}</h1>
          <p className="text-muted-foreground">Your Link Overview</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="glass-card p-6 rounded-xl hover:scale-105 hover:glow-purple transition-all duration-300 animate-scale-in group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <metric.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {metric.change}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                  <div className="text-3xl font-bold">{metric.value}</div>
                </div>
              ))}
            </div>

            {/* Chart Section */}
            <div className="glass-card p-6 rounded-xl animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Performance Overview</h2>
                  <p className="text-sm text-muted-foreground">Last 7 days activity</p>
                </div>
              </div>

              <div className="h-64 flex items-end gap-3">
                {chartData.map((clicks, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary to-purple-500 rounded-t-lg transition-all hover:from-primary/80 hover:to-purple-400 cursor-pointer animate-scale-in"
                    style={{ 
                      height: maxChartValue > 0 ? `${(clicks / maxChartValue) * 100}%` : '0%',
                      minHeight: clicks > 0 ? '20px' : '0px',
                      animationDelay: `${i * 50}ms` 
                    }}
                    title={`${clicks} clicks`}
                  />
                ))}
              </div>

              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <span key={i}>{day}</span>
                ))}
              </div>
            </div>

            {/* Pro Features Preview */}
            <div className="glass-card p-6 rounded-xl border-2 border-primary/30 relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Unlock Premium Features</h3>
                    <p className="text-muted-foreground mb-4">
                      Get advanced analytics, custom domains, unlimited links, and more with LynkScope Pro.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Advanced Analytics
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Custom Domains
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                        Priority Support
                      </span>
                    </div>
                    <Button 
                      onClick={() => navigate("/premium")}
                      className="gradient-purple glow-purple hover:glow-purple-strong transition-all hover:scale-105"
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;