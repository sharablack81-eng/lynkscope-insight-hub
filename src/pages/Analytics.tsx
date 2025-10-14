import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Link2,
  Users,
  TrendingUp,
  MousePointerClick,
  Lock,
} from "lucide-react";

// Mock data
const overviewStats = {
  totalClicks: 12847,
  uniqueVisitors: 8392,
  topPlatform: "TikTok",
  ctr: "6.8%",
};

const engagementData = {
  "7d": [
    { date: "May 8", clicks: 234 },
    { date: "May 9", clicks: 389 },
    { date: "May 10", clicks: 512 },
    { date: "May 11", clicks: 467 },
    { date: "May 12", clicks: 634 },
    { date: "May 13", clicks: 821 },
    { date: "May 14", clicks: 723 },
  ],
  "30d": [
    { date: "Week 1", clicks: 2450 },
    { date: "Week 2", clicks: 3120 },
    { date: "Week 3", clicks: 2890 },
    { date: "Week 4", clicks: 4387 },
  ],
  "90d": [
    { date: "Month 1", clicks: 8920 },
    { date: "Month 2", clicks: 11240 },
    { date: "Month 3", clicks: 12847 },
  ],
};

const platformData = [
  { name: "TikTok", value: 4523, color: "#FF0050" },
  { name: "Instagram", value: 3214, color: "#E4405F" },
  { name: "YouTube", value: 2891, color: "#FF0000" },
  { name: "Twitter", value: 1456, color: "#1DA1F2" },
  { name: "Other", value: 763, color: "#8B5CF6" },
];

const referrerData = [
  { source: "t.co", clicks: 3421, percentage: 26.6 },
  { source: "instagram.com", clicks: 2987, percentage: 23.2 },
  { source: "tiktok.com", clicks: 2654, percentage: 20.7 },
  { source: "youtube.com", clicks: 1876, percentage: 14.6 },
  { source: "facebook.com", clicks: 1234, percentage: 9.6 },
  { source: "direct", clicks: 675, percentage: 5.3 },
];

const Analytics = () => {
  const navigate = useNavigate();
  const { linkId } = useParams();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  const StatCard = ({
    title,
    value,
    icon: Icon,
    delay,
  }: {
    title: string;
    value: string | number;
    icon: any;
    delay: number;
  }) => (
    <Card
      className="glass-card p-6 hover:glow-purple transition-all hover:scale-105"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold gradient-text animate-fade-in">
            {value}
          </h3>
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-float pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/links")}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Links
            </Button>

            <Button variant="outline" disabled className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
              <Lock className="w-3 h-3" />
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-2">Link Analytics</h1>
          <p className="text-muted-foreground">
            Analytics for: <span className="text-primary font-medium">Instagram Bio Link</span>
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clicks"
            value={overviewStats.totalClicks.toLocaleString()}
            icon={MousePointerClick}
            delay={0}
          />
          <StatCard
            title="Unique Visitors"
            value={overviewStats.uniqueVisitors.toLocaleString()}
            icon={Users}
            delay={100}
          />
          <StatCard
            title="Top Platform"
            value={overviewStats.topPlatform}
            icon={TrendingUp}
            delay={200}
          />
          <StatCard
            title="CTR"
            value={overviewStats.ctr}
            icon={Link2}
            delay={300}
          />
        </div>

        {/* Engagement Chart */}
        <Card className="glass-card p-6 mb-8 animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Engagement Over Time</h2>
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-[180px] bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData[timeRange]}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis
                dataKey="date"
                stroke="#888"
                style={{ fontSize: "12px" }}
              />
              <YAxis stroke="#888" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: "#8B5CF6", r: 4 }}
                activeDot={{ r: 6, fill: "#8B5CF6" }}
                animationDuration={1500}
                fill="url(#colorClicks)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Breakdown */}
          <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "200ms" }}>
            <h2 className="text-2xl font-bold mb-6">Platform Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1500}
                  animationBegin={200}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Referrers */}
          <Card className="glass-card p-6 animate-scale-in" style={{ animationDelay: "400ms" }}>
            <h2 className="text-2xl font-bold mb-6">Top Referrers</h2>
            <div className="space-y-4">
              {referrerData.map((referrer, index) => (
                <div
                  key={referrer.source}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-medium">{referrer.source}</p>
                    <p className="text-sm text-muted-foreground">
                      {referrer.percentage}% of total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {referrer.clicks.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">clicks</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Geographic Heatmap Placeholder */}
        <Card className="glass-card p-8 text-center opacity-60 hover:opacity-80 transition-opacity animate-scale-in" style={{ animationDelay: "600ms" }}>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Geographic Insights</h3>
            <p className="text-muted-foreground mb-4">
              Unlock location analytics with LynkScope Pro
            </p>
            <Button variant="outline" disabled className="gap-2 gradient-purple">
              Upgrade to Pro
              <Lock className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
