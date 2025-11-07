import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Activity, Users, Globe, Smartphone, Monitor, TabletSmartphone } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

const AdvancedAnalytics = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveData, setLiveData] = useState({
    totalClicks: 1247,
    activeUsers: 23,
    topLink: "summer-sale",
  });

  // Simulate live data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLiveData(prev => ({
        totalClicks: prev.totalClicks + Math.floor(Math.random() * 5),
        activeUsers: Math.max(1, prev.activeUsers + Math.floor(Math.random() * 3) - 1),
        topLink: prev.topLink,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const geoData = [
    { country: "United States", clicks: 456, lat: 40, lng: -100 },
    { country: "United Kingdom", clicks: 234, lat: 51, lng: 0 },
    { country: "Canada", clicks: 189, lat: 56, lng: -106 },
    { country: "Germany", clicks: 167, lat: 51, lng: 10 },
    { country: "Australia", clicks: 134, lat: -25, lng: 133 },
  ];

  const deviceData = [
    { name: "Mobile", value: 52, color: "#8B5CF6" },
    { name: "Desktop", value: 35, color: "#A78BFA" },
    { name: "Tablet", value: 13, color: "#C4B5FD" },
  ];

  const browserData = [
    { name: "Chrome", clicks: 523 },
    { name: "Safari", clicks: 412 },
    { name: "Firefox", clicks: 178 },
    { name: "Edge", clicks: 98 },
    { name: "Other", clicks: 36 },
  ];

  return (
    <div className="space-y-6">
      {/* Live Tracking Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="premium-card border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary animate-pulse" />
                Live Tracking
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
                  Auto-refresh
                </Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Total Clicks</div>
                <div className="text-3xl font-bold">{liveData.totalClicks.toLocaleString()}</div>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Users
                </div>
                <div className="text-3xl font-bold text-primary">{liveData.activeUsers}</div>
              </div>
              <div className="premium-card p-4 rounded-xl">
                <div className="text-sm text-muted-foreground mb-1">Top Performing</div>
                <div className="text-2xl font-bold">{liveData.topLink}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Geographic Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Geographic Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Map Placeholder */}
              <div className="relative h-64 bg-gradient-to-br from-card to-muted rounded-xl overflow-hidden border border-primary/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-16 h-16 text-primary/30" />
                </div>
                {/* Simulated location dots */}
                {geoData.map((location, i) => (
                  <motion.div
                    key={location.country}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="absolute w-3 h-3 rounded-full bg-primary glow-purple-strong cursor-pointer hover:scale-150 transition-transform"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 3) * 20}%`,
                    }}
                    title={`${location.country}: ${location.clicks} clicks`}
                  />
                ))}
              </div>

              {/* Location List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {geoData.map((location, i) => (
                  <motion.div
                    key={location.country}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card transition-colors"
                  >
                    <span className="font-medium">{location.country}</span>
                    <span className="text-primary font-semibold">{location.clicks} clicks</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Device & Browser Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="premium-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="text-sm">Mobile: 52%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary/70" />
                  <span className="text-sm">Desktop: 35%</span>
                </div>
                <div className="flex items-center gap-2">
                  <TabletSmartphone className="w-4 h-4 text-primary/50" />
                  <span className="text-sm">Tablet: 13%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="premium-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Browser Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={browserData}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888" 
                    fontSize={12}
                  />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--primary) / 0.3)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="clicks" 
                    fill="#8B5CF6" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
