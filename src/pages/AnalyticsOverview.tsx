import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  MousePointerClick, 
  Users, 
  Globe
} from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { getAggregatedAnalytics, type AggregatedAnalytics } from "@/lib/analytics";

const AnalyticsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AggregatedAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await getAggregatedAnalytics();
      setAnalytics(data);
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

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Failed to load analytics</p>
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
              value={analytics.totalClicks.toLocaleString()}
            />
            <StatCard
              icon={Users}
              title="Total Links"
              value={analytics.totalLinks}
            />
            <StatCard
              icon={Globe}
              title="Top Platform"
              value={analytics.topPlatform}
            />
            <StatCard
              icon={TrendingUp}
              title="Last 7 Days"
              value={analytics.clicksLast7Days.toLocaleString()}
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
                <LineChart data={analytics.dailyClicks}>
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
                {analytics.platformBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.platformBreakdown.map((entry, index) => (
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
                {analytics.topLinks.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topLinks.slice(0, 3).map((link, index) => (
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
