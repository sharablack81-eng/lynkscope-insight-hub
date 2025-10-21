import { useState } from "react";
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

const AnalyticsOverview = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Mock aggregated data across all links
  const overviewStats = {
    totalClicks: 7892,
    totalLinks: 3,
    topPlatform: "Instagram",
    avgCTR: "12.4%"
  };

  const engagementData = {
    '7d': [
      { date: 'Mon', clicks: 245 },
      { date: 'Tue', clicks: 312 },
      { date: 'Wed', clicks: 189 },
      { date: 'Thu', clicks: 402 },
      { date: 'Fri', clicks: 356 },
      { date: 'Sat', clicks: 289 },
      { date: 'Sun', clicks: 198 }
    ],
    '30d': [
      { date: 'Week 1', clicks: 1248 },
      { date: 'Week 2', clicks: 1567 },
      { date: 'Week 3', clicks: 1892 },
      { date: 'Week 4', clicks: 2185 }
    ],
    '90d': [
      { date: 'Month 1', clicks: 2456 },
      { date: 'Month 2', clicks: 2789 },
      { date: 'Month 3', clicks: 2647 }
    ]
  };

  const platformData = [
    { name: 'Instagram', value: 3891, color: '#E1306C' },
    { name: 'TikTok', value: 2654, color: '#00F2EA' },
    { name: 'YouTube', value: 1247, color: '#FF0000' }
  ];

  const topLinks = [
    { id: 1, title: "Instagram Bio Link", clicks: 3891, platform: "Instagram" },
    { id: 2, title: "TikTok Campaign", clicks: 2654, platform: "TikTok" },
    { id: 3, title: "YouTube Promo", clicks: 1247, platform: "YouTube" }
  ];

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
              change="+12.3% from last period"
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
              change="+2.1% from last period"
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
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={timeRange === range ? "gradient-purple" : ""}
                    >
                      {range === '7d' && 'Last 7 Days'}
                      {range === '30d' && 'Last 30 Days'}
                      {range === '90d' && 'Last 90 Days'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData[timeRange]}>
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
              </CardContent>
            </Card>

            {/* Top Performing Links */}
            <Card className="glass-card border-border animate-fade-in">
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Your most clicked links</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsOverview;
