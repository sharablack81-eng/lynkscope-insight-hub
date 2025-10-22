import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  MousePointerClick, 
  Users, 
  Globe,
  BarChart3
} from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState({
    totalClicks: 0,
    totalLinks: 0,
    topPlatform: "N/A",
    avgCTR: "0%"
  });
  const [engagementData, setEngagementData] = useState<any>({
    '7d': [],
    '30d': [],
    '90d': []
  });
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all links for the user
      const { data: linksData, error: linksError } = await supabase
        .from('links')
        .select('*');

      if (linksError) throw linksError;

      // Fetch all clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('link_clicks')
        .select('*');

      if (clicksError) throw clicksError;

      // Calculate total clicks
      const totalClicks = clicksData?.length || 0;

      // Calculate platform breakdown
      const platformCounts: Record<string, number> = {};
      const platformColors: Record<string, string> = {
        'TikTok': '#00F2EA',
        'Instagram': '#E1306C',
        'YouTube': '#FF0000',
        'Other': '#888888'
      };

      for (const link of linksData || []) {
        const linkClicks = clicksData?.filter(c => c.link_id === link.id).length || 0;
        platformCounts[link.platform] = (platformCounts[link.platform] || 0) + linkClicks;
      }

      const platformArray = Object.entries(platformCounts).map(([name, value]) => ({
        name,
        value,
        color: platformColors[name] || '#888888'
      }));

      // Top platform
      const topPlatform = platformArray.length > 0 
        ? platformArray.reduce((a, b) => a.value > b.value ? a : b).name 
        : "N/A";

      // Calculate top links
      const linksWithClicks = await Promise.all(
        (linksData || []).map(async (link) => {
          const clicks = clicksData?.filter(c => c.link_id === link.id).length || 0;
          return {
            id: link.id,
            title: link.title,
            clicks,
            platform: link.platform
          };
        })
      );

      const sortedLinks = linksWithClicks
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 3);

      // Calculate engagement over time
      const now = new Date();
      const engagement7d = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayClicks = clicksData?.filter(c => {
          const clickDate = new Date(c.clicked_at);
          return clickDate.toDateString() === date.toDateString();
        }).length || 0;
        
        engagement7d.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          clicks: dayClicks
        });
      }

      setOverviewStats({
        totalClicks,
        totalLinks: linksData?.length || 0,
        topPlatform,
        avgCTR: "0%"
      });

      setPlatformData(platformArray);
      setTopLinks(sortedLinks);
      setEngagementData({
        '7d': engagement7d,
        '30d': [],
        '90d': []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change }: any) => (
    <Card className="glass-card border-border hover:border-primary/50 transition-all hover:scale-105 animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && <p className="text-xs text-primary mt-1">{change}</p>}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10 animate-fade-in">
          <div className="px-6 py-4">
            <h1 className="text-3xl font-bold">Analytics Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track performance across all your links
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={MousePointerClick}
              title="Total Clicks"
              value={overviewStats.totalClicks.toLocaleString()}
            />
            <StatCard
              icon={Users}
              title="Total Links"
              value={overviewStats.totalLinks}
            />
            <StatCard
              icon={Globe}
              title="Top Platform"
              value={overviewStats.topPlatform}
            />
            <StatCard
              icon={TrendingUp}
              title="Avg CTR"
              value={overviewStats.avgCTR}
            />
          </div>

          {/* Engagement Chart */}
          <Card className="glass-card border-border animate-fade-in">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Engagement Over Time</CardTitle>
                  <CardDescription>Total clicks across all links</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="gradient-purple"
                  >
                    Last 7 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData['7d']}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Breakdown */}
            <Card className="glass-card border-border animate-fade-in">
              <CardHeader>
                <CardTitle>Platform Breakdown</CardTitle>
                <CardDescription>Click distribution by platform</CardDescription>
              </CardHeader>
              <CardContent>
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Links */}
            <Card className="glass-card border-border animate-fade-in">
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Your most clicked links</CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length > 0 ? (
                  <div className="space-y-4">
                    {topLinks.map((link, index) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{link.title}</div>
                            <div className="text-xs text-muted-foreground">{link.platform}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{link.clicks.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">clicks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No links yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsOverview;